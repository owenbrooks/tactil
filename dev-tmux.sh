#!/bin/sh
session="fyp"
tmux new-session -d -s $session
tmux send-keys 'source env/bin/activate'
tmux send-keys Enter C-l
tmux new-window
tmux select-window -t 1
tmux attach-session -d -t $session
export PS1='${debian_chroot:+($debian_chroot)}\w\$ '
