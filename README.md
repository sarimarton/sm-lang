# lang
my private lang service

## Installation

Don't forget to clone this project with --recursive:

```
git clone --recursive https://github.com/sarimarton/sm-lang.git
```

or get the submodules after clone, before building:

```
git submodule update --init
```

After that:

```
docker build -t sm-lang .
docker run -p 80:80 --rm sm-lang
```

Example URL:

`http://localhost/lang/everything?q=Mikkamakka mesél`
