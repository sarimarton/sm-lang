FROM centos:centos7 as builder
RUN yum install -y python3
RUN curl -sL https://rpm.nodesource.com/setup_15.x | sh -
RUN yum install -y nodejs

RUN yum install -y pango.x86_64 libXcomposite.x86_64 libXcursor.x86_64 libXdamage.x86_64
RUN yum install -y libXext.x86_64 libXi.x86_64 libXtst.x86_64 cups-libs.x86_64
RUN yum install -y libXScrnSaver.x86_64 libXrandr.x86_64 GConf2.x86_64
RUN yum install -y alsa-lib.x86_64 atk.x86_64 gtk3.x86_64 xorg-x11-fonts-100dpi
RUN yum install -y xorg-x11-fonts-75dpi xorg-x11-utils xorg-x11-fonts-cyrillic
RUN yum install -y xorg-x11-fonts-Type1 xorg-x11-fonts-misc

WORKDIR /usr/app
COPY . .
RUN npm i

# FROM nginx:alpine
# COPY --from=builder /usr/_app/public /usr/share/nginx/html
EXPOSE 80 443 22
# CMD ["node", "src/index.js"]