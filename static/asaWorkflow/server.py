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
    'main': {'x': 400, 'y': 630},
    'second': {'x': 700, 'y': 630}
}

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
    global asteroids, lasers
    while True:
        for asteroid in asteroids:
            if asteroid['active']:
                asteroid['x'] += math.cos(asteroid['direction']) * asteroid['speed'] * 0.016
                asteroid['y'] += math.sin(asteroid['direction']) * asteroid['speed'] * 0.016
                if asteroid['x'] < -50 or asteroid['y'] < -50 or asteroid['x'] > 800 or asteroid['y'] > 700:
                    asteroid['active'] = False
        
        for laser in lasers:
            if laser['active']:
                laser['y'] -= 900 * 0.016
                if laser['y'] <= 0:
                    laser['active'] = False

        # Check for collisions
        for laser in lasers:
            if laser['active']:
                for asteroid in asteroids:
                    if asteroid['active'] and is_collision(laser, asteroid):
                        asteroid['active'] = False
                        laser['active'] = False

        socketio.emit('game_state', {'asteroids': asteroids, 'lasers': lasers, 'ships': ship_positions})
        socketio.sleep(0.016)  # 60 FPS

def add_random_asteroids():
    global asteroids
    while True:
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
    if player in ship_positions:
        ship_positions[player] = {'x': data['x'], 'y': data['y']}
        emit('update_position', {'player': player, 'x': data['x'], 'y': data['y']}, broadcast=True)

@socketio.on('fire_laser')
def handle_fire_laser(data):
    laser = {
        'x': data['x'],
        'y': data['y'],
        'active': True
    }
    lasers.append(laser)
    emit('laser_fired', laser, broadcast=True)

@socketio.on('restart_game')
def handle_restart_game():
    reset_game_state()
    emit('game_state', broadcast=True)

def reset_game_state():
    global asteroids
    asteroids = []
   

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    socketio.start_background_task(update_game_state)
    socketio.start_background_task(add_random_asteroids)
    socketio.run(app, host='0.0.0.0', port=5555, debug=True)
