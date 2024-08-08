import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import random

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode='eventlet')

connected_clients = []
enemy_ships = []
enemy_lasers = []

def create_enemy_ship():
    x = random.randint(0, 800)
    y = 0
    speed = 100
    return {
        'id': random.randint(1000, 9999),  # Unique identifier for each enemy
        'x': x,
        'y': y,
        'speed': speed,
        'active': True
    }

def update_game_state():
    global enemy_ships, enemy_lasers
    while True:
        for ship in enemy_ships:
            ship['y'] += ship['speed'] * 0.016
            if ship['y'] > 700:
                ship['active'] = False

        enemy_ships = [ship for ship in enemy_ships if ship['active']]

        for laser in enemy_lasers:
            laser['y'] += 250 * 0.016
            if laser['y'] > 700:
                laser['active'] = False

        enemy_lasers = [laser for laser in enemy_lasers if laser['active']]

        socketio.emit('game_state', {'enemy_ships': enemy_ships, 'enemy_lasers': enemy_lasers})
        socketio.sleep(0.016)

def add_random_enemy_ships():
    global enemy_ships
    while True:
        if len(connected_clients) > 0:
            enemy_ships.append(create_enemy_ship())
        socketio.sleep(1.1)

def enemy_shoot():
    global enemy_ships, enemy_lasers
    while True:
        for ship in enemy_ships:
            if ship['active']:
                if random.randint(1, 150) == 1:
                    laser = {
                        'x': ship['x'],
                        'y': ship['y'],
                        'active': True
                    }
                    enemy_lasers.append(laser)
        socketio.sleep(0.1)

@socketio.on('connect')
def client_connected():
    connected_clients.append(request.sid)
    print('New client connected:', request.sid)
    emit('game_state', {'enemy_ships': enemy_ships, 'enemy_lasers': enemy_lasers}, broadcast=True)

@socketio.on('disconnect')
def client_disconnected():
    print('Client disconnected:', request.sid)
    connected_clients.remove(request.sid)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    socketio.start_background_task(update_game_state)
    socketio.start_background_task(add_random_enemy_ships)
    socketio.start_background_task(enemy_shoot)
    socketio.run(app, host='0.0.0.0', port=5555, debug=True)
