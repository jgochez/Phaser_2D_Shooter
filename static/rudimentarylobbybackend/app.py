import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit
import random
import math

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode='eventlet')


num_players = 0
players = dict()

ship_positions = {
     'main_ship': {'x': 400, 'y': 630},
     'second_ship': {'x': 700, 'y': 630}
}

@app.route('/')
def index():
    global num_players
    cur_players = num_players + 1
    if cur_players <= 4:
        return render_template('index.html')
    else:
        return "Server is full"

@socketio.on('connect')
def client_connected():
    global num_players
    num_players += 1
    print(f"Players: {num_players}")
    print('New client connected:', request.sid)
    players[request.sid] = num_players
    print(players)
    match num_players:
        case 1:
            emit("assign_player", "main_ship", broadcast=False)
        case 2:
            emit("assign_player", "second_ship", broadcast=False)
        case 3:
            emit("assign_player", "spectator1", broadcast=False)
        case 4:
            emit("assign_player", "spectator2", broadcast=False)
    # emit('game_state', {'asteroids': asteroids, 'lasers': lasers, 'ships': ship_positions}, broadcast=True)

@socketio.on('disconnect')
def client_disconnected():
    global num_players
    num_players -= 1
    print('Client disconnected:', request.sid)
    del players[request.sid]

@socketio.on('player_move')
def handle_player_move(data):
    emit('update_position', data, broadcast=True) #, skip_sid=request.sid ?
    match data["player"]:
        case "main":
            ship_positions["main_ship"]["x"] = data["x"]
            ship_positions["main_ship"]["y"] = data["y"]
        case "sec":
            ship_positions["sec_ship"]["x"] = data["x"]
            ship_positions["sec_ship"]["y"] = data["y"]

@socketio.on('fire_laser')
def handle_fire_laser(data):
    laser = {
        'x': data['x'],
        'y': data['y'],
        'active': True
    }
    # lasers.append(laser)
    emit('laser_fired', laser, broadcast=True, skip_sid=request.sid)

@socketio.on('ship_destroyed')
def handle_fire_laser(data):
    destroyed_ship = {'destroyed_ship': data['ship']}
    emit('destroyed_ship', destroyed_ship, broadcast=True, skip_sid=request.sid)




if __name__ == '__main__':
    # socketio.start_background_task(update_game_state)
    # socketio.start_background_task(add_random_asteroids)
    socketio.run(app, host='0.0.0.0', port=5555, debug=True)



# # Dynamic Objects
# asteroids = []
# lasers = []
# ship_positions = {
#     'main': {'x': 400, 'y': 630},
#     'second': {'x': 700, 'y': 630}
# }

# def create_asteroid():
#     x_origin = random.randint(0, 800)
#     y_origin = 0
#     speed = 100
#     direction = math.atan2(630 - y_origin, 400 - x_origin)
#     scale = random.uniform(0.5, 1.0)
#     return {
#         'x': x_origin,
#         'y': y_origin,
#         'speed': speed,
#         'direction': direction,
#         'scale': scale,
#         'active': True
#     }

# def update_game_state():
#     global asteroids, lasers
#     while True:
#         for asteroid in asteroids:
#             if asteroid['active']:
#                 asteroid['x'] += math.cos(asteroid['direction']) * asteroid['speed'] * 0.016
#                 asteroid['y'] += math.sin(asteroid['direction']) * asteroid['speed'] * 0.016
#                 if asteroid['x'] < -50 or asteroid['y'] < -50 or asteroid['x'] > 800 or asteroid['y'] > 700:
#                     asteroid['active'] = False
        
#         for laser in lasers:
#             if laser['active']:
#                 laser['y'] -= 900 * 0.016
#                 if laser['y'] <= 0:
#                     laser['active'] = False

#         # Check for collisions
#         for laser in lasers:
#             if laser['active']:
#                 for asteroid in asteroids:
#                     if asteroid['active'] and is_collision(laser, asteroid):
#                         asteroid['active'] = False
#                         laser['active'] = False

#         socketio.emit('game_state', {'asteroids': asteroids, 'lasers': lasers, 'ships': ship_positions})
#         socketio.sleep(0.016)  # 60 FPS

# def add_random_asteroids():
#     global asteroids
#     while True:
#         asteroids.append(create_asteroid())
#         socketio.sleep(0.5)

# def is_collision(laser, asteroid):
#     return (laser['x'] > asteroid['x'] - 25 and laser['x'] < asteroid['x'] + 25 and
#             laser['y'] > asteroid['y'] - 25 and laser['y'] < asteroid['y'] + 25)

# @socketio.on('connect')
# def client_connected():
#     print('New client connected:', request.sid)
#     emit('game_state', {'asteroids': asteroids, 'lasers': lasers, 'ships': ship_positions}, broadcast=True)

# @socketio.on('disconnect')
# def client_disconnected():
#     print('Client disconnected:', request.sid)

# @socketio.on('player_move')
# def handle_player_move(data):
#     player = data['player']
#     if player in ship_positions:
#         ship_positions[player] = {'x': data['x'], 'y': data['y']}
#         emit('update_position', {'player': player, 'x': data['x'], 'y': data['y']}, broadcast=True)

# @socketio.on('fire_laser')
# def handle_fire_laser(data):
#     laser = {
#         'x': data['x'],
#         'y': data['y'],
#         'active': True
#     }
#     lasers.append(laser)
#     emit('laser_fired', laser, broadcast=True)

# @socketio.on('restart_game')
# def handle_restart_game():
#     reset_game_state()
#     emit('game_state', broadcast=True)

# def reset_game_state():
#     global asteroids
#     asteroids = []
   


