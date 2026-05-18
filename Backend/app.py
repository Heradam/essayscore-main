from flask import Flask
from flask_cors import CORS

from config import Config
from controllers.admin_controller import admin_bp
from controllers.auth_controller import auth_bp
from controllers.invite_controller import invite_bp
from controllers.points_controller import points_bp
from controllers.class_controller import class_bp
from controllers.essay_controller import essay_bp
from controllers.ocr_controller import ocr_bp
from controllers.teacher_controller import teacher_bp
from extensions import db, jwt


def create_app():
    app = Flask(__name__)
    app.config.from_object(Config)

    CORS(app)
    db.init_app(app)
    jwt.init_app(app)

    with app.app_context():
        db.create_all()

    app.register_blueprint(auth_bp)
    app.register_blueprint(admin_bp)
    app.register_blueprint(invite_bp)
    app.register_blueprint(points_bp)
    app.register_blueprint(class_bp)
    app.register_blueprint(essay_bp)
    app.register_blueprint(ocr_bp)
    app.register_blueprint(teacher_bp)

    @app.get("/healthz")
    def healthz():
        return {"status": "ok"}

    return app


app = create_app()


if __name__ == '__main__':
    app.run(debug=True, port=5000)
