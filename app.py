from flask import Flask, render_template

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005)


# git init
# git add README.md
# git commit -m "first commit"
# git branch -M main
# git remote add origin git@github.com:jgochez/Phaser_2D_Shooter.git
# git push -u origin main