# Tuan Tanah

Game papan jual-beli properti online untuk 2 sampai 4 pemain. Satu file `index.html`, tanpa server sendiri.

**Main:** https://syahpurbachtiar-oss.github.io/tuan-tanah/

## Cara main

1. Satu orang isi nama lalu tekan **Buat room**. Muncul kode 5 huruf.
2. Bagikan kode (atau tombol **Salin link undangan**) ke teman. Mereka isi nama, masukkan kode, tekan **Gabung**.
3. Pembuat room tekan **Mulai permainan**. Urutan giliran diacak.

Pembuat room adalah host: tab host harus tetap terbuka. Kalau tab tertutup atau ter-refresh, buka lagi link-nya dan tekan **Lanjutkan room**.

## Aturan

Aturan klasik game papan properti:

- Modal $1500, lewat MULAI terima $200.
- Berhenti di properti kosong: beli, atau dilelang ke semua pemain.
- Sewa tanah 2x kalau satu pemain punya semua kota sewarna. Stasiun $25/50/100/200. Perusahaan 4x atau 10x angka dadu.
- Rumah dan hotel dibangun merata, stok bank 32 rumah dan 12 hotel. Dijual kembali setengah harga.
- Gadai dapat setengah harga, tebus tambah bunga 10%. Properti gadai yang berpindah tangan kena biaya 10%.
- Dadu kembar lempar lagi, kembar tiga kali masuk penjara. Keluar penjara: dadu kembar, bayar $50, atau kartu bebas. Gagal tiga kali wajib bayar $50.
- Kartu Nasib dan Kas Warga, masing-masing 16 kartu.
- Tukar properti, uang, dan kartu bebas penjara antar pemain kapan saja.
- Tidak sanggup bayar: jual bangunan, gadai, tukar, atau bangkrut. Aset ke penagih, atau ke bank lalu dilelang.
- Pemain terakhir yang tidak bangkrut menang.

Penyederhanaan: tidak ada lelang rebutan saat stok rumah bank menipis (siapa cepat dia dapat), dan kalau bank tidak punya 4 rumah pengganti saat hotel dijual, semua bangunan di grup warna itu ikut dijual.

## Teknis

- Sinkronisasi lewat broker MQTT publik (`broker.emqx.io`, cadangan `broker.hivemq.com`) dengan pustaka `mqtt.js` dari CDN. Host memegang state dan memvalidasi semua aksi.
- Broker sendiri: tambahkan `?broker=wss://alamat-broker/mqtt` di URL (semua pemain harus pakai URL yang sama).
- Tes aturan: `node test/engine.test.js index.html`
