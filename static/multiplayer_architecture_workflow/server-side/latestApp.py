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

def update_game_state():
    global asteroids, lasers, ship_positions, scores
    while True:
        active_asteroids = [a for a in asteroids if a['active']]
        for asteroid in active_asteroids:
            asteroid['x'] += math.cos(asteroid['direction']) * asteroid['speed'] * 0.016
            asteroid['y'] += math.sin(asteroid['direction']) * asteroid['speed'] * 0.016
            if asteroid['x'] < -100 or asteroid['y'] < -100 or asteroid['x'] > 800 or asteroid['y'] > 700:
                asteroid['active'] = False

        for laser in lasers:
            if laser['active']:
                laser['y'] -= 900 * 0.016
                if laser['y'] <= 0:
                    laser['active'] = False

        for ship in ship_positions.values():
            multiplier = 1000
            ship['x'] += ship['dx'] * multiplier * 0.016
            ship['y'] += ship['dy'] * multiplier * 0.016
            ship['x'] = max(0, min(800, ship['x']))
            ship['y'] = max(0, min(700, ship['y']))

        for laser in lasers:
            if laser['active']:
                for asteroid in active_asteroids:
                    if asteroid['active'] and is_collision(laser, asteroid):
                        asteroid['active'] = False
                        laser['active'] = False
                        scores[laser['player']] += 5

        socketio.emit('game_state', {'asteroids': asteroids, 'lasers': lasers, 'ships': ship_positions, 'scores': scores})
        socketio.sleep(0.016)

def add_random_asteroids():
    global asteroids
    while True:
        if ready_players.get('main') and ready_players.get('second'):
            if len([a for a in asteroids if a['active']]) < MAX_ASTEROIDS:
                asteroids.append(create_asteroid())
        socketio.sleep(0.5)

def is_collision(laser, asteroid):
    return (laser['x'] > asteroid['x'] - 25 and laser['x'] < asteroid['x'] + 25 and
            laser['y'] > asteroid['y'] - 25 and laser['y'] < asteroid['y'] + 25)

@socketio.on('connect')
def client_connected():
    if len(connected_clients) >= 2:
        emit('error', {'message': 'Server full.'})
        disconnect()
        return

    connected_clients.append(request.sid)
    print('New client connected:', request.sid)
    emit('game_state', {'asteroids': asteroids, 'lasers': lasers, 'ships': ship_positions, 'scores': scores, 'ready': ready_players}, broadcast=True)

@socketio.on('disconnect')
def client_disconnected():
    print('Client disconnected:', request.sid)
    connected_clients.remove(request.sid)
    reset_game_state()
    emit('game_state', {'asteroids': asteroids, 'lasers': lasers, 'ships': ship_positions, 'scores': scores}, broadcast=True)

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
    emit('game_state', {'asteroids': asteroids, 'lasers': lasers, 'ships': ship_positions, 'scores': scores}, broadcast=True)
    emit('reset_ready_state', broadcast=True)

@socketio.on('player_ready')
def handle_player_ready(data):
    player = data['player']
    ready_players[player] = True
    emit('player_ready', ready_players, broadcast=True)
    if all(ready_players.values()):
        emit('start_game', broadcast=True)

def reset_game_state():
    global asteroids, lasers, ship_positions, scores, ready_players
    asteroids = []
    lasers = []
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
    socketio.run(app, host='0.0.0.0', port=5555, debug=True)
