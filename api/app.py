import os
from flask import Flask, make_response, request, jsonify, send_from_directory
from werkzeug.utils import secure_filename
from process_cloud import process
from generate_stl import generate
from flask_cors import CORS
import secrets

UPLOAD_FOLDER = "./pcd_uploads"
ALLOWED_EXTENSIONS = {"txt", "pdf", "png", "jpg", "jpeg", "gif", "pcd", "xyz"}
MAX_CONTENT_LENGTH = 16 * 1000 * 1000 * 1000
OUTPUT_FOLDER = "./stl_output"
IMAGE_FOLDER = "./image_output"

app = Flask(__name__)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER
app.config["MAX_CONTENT_LENGTH"] = MAX_CONTENT_LENGTH
app.debug = True
app.config["SECRET_KEY"] = secrets.token_urlsafe(
    16
)  # re-generates key on every startup. Okay if we don't mind invalidating user's cookies
CORS(app)


def allowed_file(filename):
    return "." in filename and filename.rsplit(".", 1)[1].lower() in ALLOWED_EXTENSIONS


@app.route("/process", methods=["POST"])
def process_file():
    content_type = request.headers.get("Content-Type")
    if content_type == "application/json":
        json = request.json
        print(json)
    else:
        return "Content-Type not supported!"

    # TODO: validate filename
    cloud_path = os.path.join(UPLOAD_FOLDER, json["filename"])
    box_outputs, image_info = process(
        cloud_path, IMAGE_FOLDER, visualise=False
    )

    resp = jsonify(
        {
            "message": "File successfully processed",
            "box_outputs": box_outputs,
            "pcd_image_info": image_info,
        }
    )
    resp.status_code = 200
    return resp


@app.route("/generate", methods=["POST"])
def generate_model():
    content_type = request.headers.get("Content-Type")
    if content_type == "application/json":
        json = request.json
    else:
        return "Content-Type not supported!"

    # TODO: validate filename
    box_outputs = json["box_outputs"]
    generate(box_outputs, visualise=False)

    resp = jsonify({"message": "File successfully generated"})
    resp.status_code = 200
    return resp


@app.route("/upload", methods=["POST"])
def upload_file():
    if request.method == "POST":
        # check if the post request has the file part
        if "file" not in request.files:
            return "File uploaded incorrectly", 400
        file = request.files["file"]
        # If the user does not select a file, the browser submits an
        # empty file without a filename.
        if file.filename == "":
            return "No selected file", 400
        if file and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            file.save(os.path.join(app.config["UPLOAD_FOLDER"], filename))
            response = make_response("")
            response.headers.add("Access-Control-Allow-Origin", "*")
            return response
        else:
            return "File type not supported", 400


@app.route("/uploads/<name>")
def download_file(name):
    return send_from_directory(app.config["UPLOAD_FOLDER"], name)


@app.route("/image_output/<name>")
def send_pcd_image(name):
    return send_from_directory(IMAGE_FOLDER, name)


@app.route("/generate/output")
def download_output():
    return send_from_directory(OUTPUT_FOLDER, "out.stl")
