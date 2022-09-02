import numpy as np
import sys
import os
from tactil_api.process_cloud import process

if __name__ == "__main__":
    visualise = False
    if len(sys.argv) > 2:
        visualise = sys.argv[2] == "visualise"

    # create output directories
    output_dir = "output"
    image_dir = os.path.join(output_dir, "images")
    if not os.path.exists(image_dir):
        os.makedirs(image_dir, exist_ok=True)

    # process point cloud
    outputs, image_info = process(sys.argv[1], image_dir, visualise=visualise)
