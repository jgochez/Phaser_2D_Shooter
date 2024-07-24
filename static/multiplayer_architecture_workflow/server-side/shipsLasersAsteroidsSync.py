import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import random
import math

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode='eventlet')

# Dynamic Objects
asteroids = []
lasers = []
ship_positions = {
    'main': {'x': 400, 'y': 630, 'dx': 0, 'dy': 0},
    'second': {'x': 700, 'y': 630, 'dx': 0, 'dy': 0}
}
MAX_ASTEROIDS = 20

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
    global asteroids, lasers, ship_positions
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

        socketio.emit('game_state', {'asteroids': asteroids, 'lasers': lasers, 'ships': ship_positions})
        socketio.sleep(0.016)

def add_random_asteroids():
    global asteroids
    while True:
        if len([a for a in asteroids if a['active']]) < MAX_ASTEROIDS:
            asteroids.append(create_asteroid())
        socketio.sleep(0.5)

def is_collision(laser, asteroid):
    return (laser['x'] > asteroid['x'] - 25 and laser['x'] < asteroid['x'] + 25 and
            laser['y'] > asteroid['y'] - 25 and laser['y'] < asteroid['y'] + 25)

@socketio.on('connect')
def client_connected():
    print('New client connected:', request.sid)
    emit('game_state', {'asteroids': asteroids, 'lasers': lasers, 'ships': ship_positions}, broadcast=True)

@socketio.on('disconnect')
def client_disconnected():
    print('Client disconnected:', request.sid)

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
        'active': True
    }
    lasers.append(laser)

@socketio.on('restart_game')
def handle_restart_game():
    reset_game_state()

def reset_game_state():
    global asteroids, lasers, ship_positions
    asteroids = []
    lasers = []
    ship_positions = {
        'main': {'x': 400, 'y': 630, 'dx': 0, 'dy': 0},
        'second': {'x': 700, 'y': 630, 'dx': 0, 'dy': 0}
    }

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    socketio.start_background_task(update_game_state)
    socketio.start_background_task(add_random_asteroids)
    socketio.run(app, host='0.0.0.0', port=5555, debug=True)
