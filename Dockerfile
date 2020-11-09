FROM centos:centos7 as builder

RUN yum install -y python3

RUN curl -sL https://rpm.nodesource.com/setup_15.x | sh -
RUN yum install -y nodejs

# Install puppeteer
# https://github.com/puppeteer/puppeteer/issues/2857#issuecomment-440672756
RUN yum install -y pango libXcomposite libXcursor libXdamage libXext libXi \
  libXtst cups-libs libXScrnSaver libXrandr GConf2 alsa-lib atk gtk3 \
  ipa-gothic-fonts xorg-x11-fonts-100dpi xorg-x11-fonts-75dpi xorg-x11-utils \
  xorg-x11-fonts-cyrillic xorg-x11-fonts-Type1 xorg-x11-fonts-misc

WORKDIR /usr/app
COPY . .
RUN npm i

# Install foma
RUN yum install -y gcc make git zlib-devel.x86_64 flex bison readline-devel.x86_64
RUN cd deps && \
  git clone https://github.com/mhulden/foma.git && \
  cd foma/foma && \
  make

# Install hunmorph-foma
RUN cd deps && \
  git clone https://github.com/r0ller/hunmorph-foma.git && \
  cd hunmorph-foma && \
  mkdir lexc && \
  mv ./adj lexc && \
  mv ./fxpp lexc && \
  mv ./misc lexc && \
  mv ./noun lexc && \
  mv ./num lexc && \
  mv ./verb lexc && \
  export PATH="/usr/app/deps/foma/foma:$PATH" && \
  make

# FROM nginx:alpine
# COPY --from=builder /usr/_app/public /usr/share/nginx/html
EXPOSE 80 443 22
CMD ["node", "src/index.js"]