# Final Year Project: Automated 3D-printed map generation

![Screenshot of filtered point cloud](./screenshot.png)

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
1. Download a .pcd file (e.g. `pcd_file.pcd`)
1. `source env/bin/activate`
2. `python multiplane.py pcd_file.pcd`