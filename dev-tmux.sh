#!/bin/sh
session="fyp"
tmux new-session -d -s $session
tmux send-keys 'source env/bin/activate'
tmux send-keys Enter C-l
tmux new-window
tmux select-window -t 1
tmux send-keys 'cd api && flask run'
tmux split-window -h
tmux send-keys 'cd ui && npm start'
tmux split-window -v
# tmux send-keys 'roslaunch e2e_handover papillarray.launch'
tmux select-pane -t 0
tmux split-window -v -t 0
tmux attach-session -d -t $session
export PS1='${debian_chroot:+($debian_chroot)}\w\$ '
export FLASK_ENV=development
