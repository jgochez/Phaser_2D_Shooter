import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, disconnect
import random
import math

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode='eventlet')

asteroids = []
lasers = []
enemy_ships = []
enemy_lasers = []
ship_positions = {
    'main': {'x': 400, 'y': 630, 'dx': 0, 'dy': 0, 'alive': True},
    'second': {'x': 700, 'y': 630, 'dx': 0, 'dy': 0, 'alive': True}
}
MAX_ASTEROIDS = 20
scores = {
    'main': 0,
    'second': 0
}
ready_players = {
    'main': False,
    'second': False
}
connected_clients = []

def create_asteroid():
    x_origin = random.randint(0, 800)
    y_origin = 0
    speed = 100
    direction = math.atan2(630 - y_origin, 400 - x_origin)
    scale = random.uniform(0.5, 1.0)
    return {
        'x': x_origin,
        'y': y_origin,
        'speed': speed,
        'direction': direction,
        'scale': scale,
        'active': True
    }

def create_enemy_ship():
    x = random.randint(0, 800)
    y = 0
    speed = 100
    return { 
        'x': x,
        'y': y,
        'speed': speed,
        'active': True
    }

def update_game_state():
    global asteroids, lasers, ship_positions, scores, enemy_ships, enemy_lasers
    fps = 0.0167
    multiplier = 1000
    while True:
        active_asteroids = [a for a in asteroids if a['active']]
        for asteroid in active_asteroids:
            asteroid['x'] += math.cos(asteroid['direction']) * asteroid['speed'] * fps
            asteroid['y'] += math.sin(asteroid['direction']) * asteroid['speed'] * fps
            if asteroid['x'] < -100 or asteroid['y'] < -100 or asteroid['x'] > 800 or asteroid['y'] > 700:
                asteroid['active'] = False

        for laser in lasers:
            if laser['active']:
                laser['y'] -= 900 * fps
                if laser['y'] <= 0:
                    laser['active'] = False

        for ship in ship_positions.values():
            
            ship['x'] += ship['dx'] * (fps * multiplier) 
            ship['y'] += ship['dy'] * (fps * multiplier)
            ship['x'] = max(50, min(750, ship['x']))
            ship['y'] = max(50, min(650, ship['y']))

        for laser in lasers:
            if laser['active']:
                for asteroid in active_asteroids:
                    if asteroid['active'] and is_collision(laser, asteroid):
                        asteroid['active'] = False
                        laser['active'] = False
                        scores[laser['player']] += 5

        for ship in enemy_ships:
            ship['y'] += ship['speed'] * fps
            if ship['y'] > 700:
                ship['active'] = False

        enemy_ships = [ship for ship in enemy_ships if ship['active']]

        for laser in enemy_lasers:
            laser['y'] += 300 * fps
            if laser['y'] > 700:
                laser['active'] = False

        enemy_lasers = [laser for laser in enemy_lasers if laser['active']]

        for player, ship in ship_positions.items():
            if ship['alive']:
                for enemy in enemy_ships:
                    if is_collision(ship, enemy):
                        ship['alive'] = False
                        enemy['active'] = False
                        scores[player] -= 20
                        if scores[player] < 0:
                            scores[player] = 0
                for laser in enemy_lasers:
                    if is_collision(ship, laser):
                        ship['alive'] = False
                        laser['active'] = False
                        scores[player] -= 20
                        if scores[player] < 0:
                            scores[player] = 0

        for laser in lasers:
            if laser['active']:
                for enemy in enemy_ships:
                    if is_collision(laser, enemy):
                        laser['active'] = False
                        enemy['active'] = False
                        scores[laser['player']] += 10

        socketio.emit('game_state', {
            'asteroids': asteroids,
            'lasers': lasers,
            'ships': ship_positions,
            'scores': scores,
            'enemy_ships': enemy_ships,
            'enemy_lasers': enemy_lasers
        })
        socketio.sleep(fps)

def add_random_asteroids():
    global asteroids
    while True:
        if ready_players.get('main') and ready_players.get('second'):
            if len([a for a in asteroids if a['active']]) < MAX_ASTEROIDS:
                asteroids.append(create_asteroid())
        socketio.sleep(1)

def add_random_enemy_ships():
    global enemy_ships
    while True:
        if ready_players.get('main') and ready_players.get('second'):
            if len(connected_clients) > 0:
                enemy_ships.append(create_enemy_ship())
        socketio.sleep(1.1)

def enemy_shoot():
    global enemy_ships, enemy_lasers
    while True:
        for ship in enemy_ships:
            if ship['active']:
                if random.randint(1, 100) == 1:
                    laser = {
                        'x': ship['x'],
                        'y': ship['y'],
                        'active': True
                    }
                    enemy_lasers.append(laser)
        socketio.sleep(0.05)

def is_collision(obj1, obj2):
    return (obj1['x'] > obj2['x'] - 25 and obj1['x'] < obj2['x'] + 25 and
            obj1['y'] > obj2['y'] - 25 and obj1['y'] < obj2['y'] + 25)

@socketio.on('connect')
def client_connected():
    if len(connected_clients) >= 2:
        emit('error', {'message': 'Server full.'})
        disconnect()
        return

    connected_clients.append(request.sid)
    print('New client connected:', request.sid)
    emit('game_state', {'asteroids': asteroids, 'lasers': lasers, 'ships': ship_positions, 'scores': scores, 'ready': ready_players, 'enemy_ships': enemy_ships, 'enemy_lasers': enemy_lasers}, broadcast=True)

@socketio.on('disconnect')
def client_disconnected():
    print('Client disconnected:', request.sid)
    connected_clients.remove(request.sid)
    reset_game_state()
    emit('game_state', {'asteroids': asteroids, 'lasers': lasers, 'ships': ship_positions, 'scores': scores, 'enemy_ships': enemy_ships, 'enemy_lasers': enemy_lasers}, broadcast=True)

@socketio.on('player_move')
def handle_player_move(data):
    player = data['player']
    ship_positions[player]['dx'] = data['dx']
    ship_positions[player]['dy'] = data['dy']

@socketio.on('fire_laser')
def handle_fire_laser(data):
    laser = {
        'x': data['x'],
        'y': data['y'],
        'active': True,
        'player': data['player']
    }
    lasers.append(laser)

@socketio.on('restart_game')
def handle_restart_game():
    reset_game_state()
    emit('game_state', {'asteroids': asteroids, 'lasers': lasers, 'ships': ship_positions, 'scores': scores, 'enemy_ships': enemy_ships, 'enemy_lasers': enemy_lasers}, broadcast=True)
    emit('reset_ready_state', broadcast=True)

@socketio.on('player_ready')
def handle_player_ready(data):
    player = data['player']
    ready_players[player] = True
    emit('player_ready', ready_players, broadcast=True)
    if all(ready_players.values()):
        emit('start_game', broadcast=True)

def reset_game_state():
    global asteroids, lasers, ship_positions, scores, ready_players, enemy_ships, enemy_lasers
    asteroids = []
    lasers = []
    enemy_ships = []
    enemy_lasers = []
    ship_positions = {
        'main': {'x': 400, 'y': 630, 'dx': 0, 'dy': 0, 'alive': True},
        'second': {'x': 700, 'y': 630, 'dx': 0, 'dy': 0, 'alive': True}
    }
    scores = {
        'main': 0,
        'second': 0
    }
    ready_players = {
        'main': False,
        'second': False
    }

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    socketio.start_background_task(update_game_state)
    socketio.start_background_task(add_random_asteroids)
    socketio.start_background_task(add_random_enemy_ships)
    socketio.start_background_task(enemy_shoot)
    socketio.run(app, host='0.0.0.0', port=5555, debug=True)
