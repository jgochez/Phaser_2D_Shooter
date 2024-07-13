import eventlet
eventlet.monkey_patch()

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, disconnect

app = Flask(__name__)
app.config['SECRET_KEY'] = 'secret!'
socketio = SocketIO(app, async_mode='eventlet')

@app.route('/')
def index():
    return render_template('index.html')

@socketio.on('connect')
def client_connected():
    print('New client connected:', request.sid)
        
@socketio.on('player_move')
def handle_player_move(data):
    emit('update_position', data, broadcast=True)

@socketio.on('disconnect')
def client_disconnected():
    print('Client disconnected:', request.sid)

if __name__ == '__main__':
    socketio.run(app, host='0.0.0.0', port=5555, debug=True)
