FROM ubuntu:22.04

# Dev tools and open3d-compatible python version
RUN apt-get -y update \
    && apt-get install -y software-properties-common \
    && add-apt-repository ppa:deadsnakes/ppa \
    && DEBIAN_FRONTEND=noninteractive apt-get install -y \
    vim nano git wget tmux sudo \
    libcanberra-gtk3-module \
    python3.9 python3.9-distutils python3.9-venv python3-pip \
    nodejs npm \
    libgl1 libgomp1 \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create a non-root user with sudo privileges
ARG USERNAME=docker
ARG USER_UID=1000
ARG USER_GID=$USER_UID
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME \
    && echo $USERNAME ALL=\(root\) NOPASSWD:ALL > /etc/sudoers.d/$USERNAME \
    && chmod 0440 /etc/sudoers.d/$USERNAME
ENV HOMEDIR=/home/${USERNAME}

# Create python virtualenv and pip install dependencies
ENV VIRTUAL_ENV=${HOMEDIR}/venv
RUN python3.9 -m venv $VIRTUAL_ENV
ENV PATH="$VIRTUAL_ENV/bin:$PATH"

# Install python dependencies:
COPY requirements.txt .
RUN python3.9 -m pip install -r requirements.txt

# Install npm dependencies
ENV SOURCE_DIR=${HOMEDIR}/fyp
WORKDIR ${SOURCE_DIR}/ui
COPY ui/package-lock.json ui/package.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy source files
COPY . ${SOURCE_DIR}

# Change owner of files in home to non-root user
WORKDIR ${SOURCE_DIR}
RUN chown -R ${USERNAME} /home/${USERNAME}
# Change prompt to show we are in a docker container
RUN echo "export PS1='\[\e]0;\u@docker: \w\a\]${debian_chroot:+($debian_chroot)}\[\033[01;32m\]\u@docker\[\033[00m\]:\[\033[01;34m\]\w\[\033[00m\]\$ '" >> /home/${USERNAME}/.bashrc
# Add tmux configuration file
COPY docker/.tmux.conf /home/${USERNAME}/.tmux.conf

WORKDIR ${SOURCE_DIR}
CMD /bin/bash
USER $USERNAME
