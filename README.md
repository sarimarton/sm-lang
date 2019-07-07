# lang
my private lang service

## Dependencies

- foma
- hunmorph-foma
- puppeteer

foma and hunmorph-foma must be installed in the deps/ folder (as 'foma' and
'hunmorph-foma' folders).

### Installing Puppeteer

For puppeteer, on macOS there's no problem. On CentOS7, you have to follow these
steps: https://github.com/GoogleChrome/puppeteer/issues/2857

### Installing foma:

- mkdir deps
    - Elérés: https://bitbucket.org/mhulden/foma/downloads/ (vagy https://code.google.com/archive/p/foma/)
    - Elvileg kínál binárisokat, de nekem a source fordítással ment. A binárisok mindenféle hiányzó libek miatt elfaileltek (libtinfo.so.5 és valami más)
        - mac-en gond nélkül ment: source tarball kicsomagol, majd 'make'. Lefutott a compile, léterjöttek a binárisok, ennyi.
        - CentOS7-en több szívás volt
            - 64 bitest letölteni: wget https://bitbucket.org/mhulden/foma/downloads/foma-0.9.18_linux64.tar.gz
            - kicsomagol: tar xvzf foma-0.9.18_linux64.tar.gz
            - make - ha jó, akkor örül, ha elfailel, mert nincs gcc, akkor:
            - yum install gcc
            - make - ha jó, akkor örül, ha elfailel hiányzó termcap meg readline libek miatt, akkor:
            - yum install readline-devel.x86_64 (vagy általánosabban a hiányzó libeket kikeresni yum list | grep <lib neve> paranccsal)
            - hál istennek a termcap-et már nem kell telepíteni, mert amúgy nincs is rá yum csomag, mostmár a make le fog futni elvileg, warningokkal ugyan, de lefut, és létrejön a foma és flookup binárisok

### Install hunmorph-foma:

    - Innen letölthető: https://github.com/r0ller/hunmorph-foma
    - A leírás alapján még nem fog menni, de a megoldás itt van: https://hup.hu/node/158237
        - Eleve a chksys.sh a tools mappában van. Az megnézi, hogy telepítve van-e a make és a foma. Elvileg már igen.
        - Létre kell hozni egy lexc mappát a hunmorph-foma-n belül, és belemásolni az alábbi mappákat: adj, fxpp, misc, noun, num, verb mappákat
        - Ezután le fog futni a make a leírás alapján
        - Innentől lehet játszani a leírás alapján a foma interface-szel, de csak sima morfológiai elemzésre ez a parancs:
            - echo asszonyállattal | ./foma/src/foma-0.9.18/flookup hunfnnum.fst
