# Final Year Project: Automated 3D-printed map generation

![Screenshot of filtered point cloud](assets/screenshot.png)

## Requirements
- Linux (ubuntu/arch)
- Python 3.9 (`yay -S python39`)
- pip (`sudo pacman -S python-pip`)
- virtualenv (`pip install virtualenv`)
- rust

## Environment Setup
1. `git clone https://github.com/owenbrooks/fyp.git && cd fyp`
2. `python -m virtualenv --python=/usr/bin/python3.9 env`
3. `source env/bin/activate`
4. `pip install -r requirements.txt`

## How to build
- `maturin develop`

## How to run 
### Generating an STL from a point cloud (.pcd) file
1. Download a .pcd file (e.g. `pcd_file.pcd`)
1. `source env/bin/activate`
2. `python process_cloud.py pcd_file.pcd`
3. `python generate_stl.py`

The generated STL file can be found in `output/out.stl`

### Running the flask api
1. `source env/bin/activate`
2. `cd backend`
3. `flask run --host=0.0.0.0`

The upload form can be found at [http://127.0.0.1:5000](http://127.0.0.1:5000)