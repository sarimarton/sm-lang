// import { exec } from 'child_process'
const exec = require('child_process').exec

exec(`curl 'https://translate.google.hu/translate_a/single?client=webapp&sl=auto&tl=en&hl=en&dt=at&dt=bd&dt=ex&dt=ld&dt=md&dt=qca&dt=rw&dt=rm&dt=ss&dt=t&dt=gt&source=bh&ssel=0&tsel=0&kc=1&tk=942168.589626&q=Marci%20vagyok' -H 'pragma: no-cache' -H 'cookie: SID=egVXzVuZ2iU7QJNyy-MuCgyeO3ViLbrPLFxc10w226ZuIuO0DvTeyRHxo4ixeu0HzmX_QA.; HSID=Afd8bg2x2p_VhsA0f; SSID=AgVjQZZ5VMHJfWFA3; APISID=HigVtnxVLjJVKZkc/Ac2F6PYQMfN7LpMDh; SAPISID=5XdXKVZ5P1ksOwaa/AJe76nn6F4Z2mSki3; _ga=GA1.3.58620073.1562466680; _gid=GA1.3.1894007278.1562466680; 1P_JAR=2019-7-7-2; NID=187=A9QzdrCi67JL49q_EEk3F7hBqDrQ8F-A-SoOyWr0-iGCXrqfM_TfjJ8c0EBSOf5kdItQR7OXHNYTJ1ymDf_RjO7qzIcbkwk45JF7Rz2sGQ81iU3-Wc8I-ZOHratTnvarqWcM_kLo6uh7SEm4X0uVfys82Vq3crN9KImjsDE1BeI3GK82E1u-SY-dPVR-eUQrZYg6RgANiMQSc_A6qPmDHZmwH-_uwxRfpKSlYR46zjM6D-EF9c2leCZNa4n3J6k4knH5NhHi9rxvgoyEGpiEegbfS0h9ttbG4Q' -H 'accept-encoding: gzip, deflate, br' -H 'accept-language: hu-HU,hu;q=0.9,en-US;q=0.8,en;q=0.7' -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_14_5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3770.100 Safari/537.36' -H 'accept: */*' -H 'cache-control: no-cache' -H 'authority: translate.google.hu' -H 'referer: https://translate.google.hu/' -H 'x-client-data: CIm2yQEIprbJAQjEtskBCKmdygEIqKPKAQixp8oBCOKoygEI8anKAQiXrcoBCLutygEIzK3KAQjurcoBCLqvygE=' --compressed`,
  (error, stdout, stderr) => {
    console.log(JSON.parse(stdout)[0][0][0])
  }
)
