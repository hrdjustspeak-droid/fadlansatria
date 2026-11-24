# Panduan Editor

Panduan ini untuk mengubah isi website tanpa menyentuh kode. Semua dilakukan dari panel admin, dan bisa dari HP.

> **Screenshot:** tempat gambar ditandai `📷`. Ambil screenshot dari panel admin setelah situs online, simpan di folder `docs/panduan/`, lalu ganti tanda tersebut dengan gambarnya.

## Cara masuk

1. Buka `namaweb.com/admin`.
2. Klik **Login with GitHub**, lalu izinkan aksesnya. Akun GitHub Anda harus sudah diundang oleh developer.
3. Anda akan melihat empat menu di kiri: **Pengaturan Situs**, **Halaman**, **Halaman Custom**, dan **Proyek**.

📷 *Halaman login dan menu utama*

## Cara menyimpan

- Setelah mengubah apa pun, klik **Save** (Simpan) di kanan atas.
- Website diperbarui otomatis dalam **1–3 menit**. Muat ulang halaman website untuk melihat hasilnya.
- Kalau ada isian yang salah (misalnya terlalu panjang), kolomnya ditandai merah dan perubahan belum tersimpan. Baca pesan di bawah kolom tersebut.
- Salah simpan? Tenang, semua versi lama tersimpan. Minta developer mengembalikannya.

## 1. Mengganti judul besar di beranda (hero)

1. Buka **Halaman → Beranda**.
2. Klik section **Hero** di daftar Section.
3. Ubah **Judul Besar** (maks. 80 karakter) dan **Sub-judul** (maks. 160 karakter).
4. Untuk mengganti foto: klik **Gambar → Ganti**, pilih foto dari HP/komputer. Foto otomatis dikompres.
5. Isi **Deskripsi Gambar (alt)**, misalnya "Raka sedang sketsa logo di studio".
6. Klik **Save**.

📷 *Form section Hero*

**Gaya Tampilan hero:**
- **Split**: teks di kiri, foto di kanan (paling aman).
- **Tengah**: judul besar di tengah, foto lebar di bawahnya.
- **Layar penuh**: foto memenuhi layar dan teks putih di atasnya. Sistem otomatis menambah lapisan gelap supaya teks tetap terbaca.

## 2. Menambah proyek baru (dengan 3 gambar dan 1 video)

1. Buka **Proyek → New Proyek** (Tambah).
2. Isi **Judul**, **Kategori**, **Tahun**, dan **Ringkasan** (tampil di kartu, maks. 160 karakter).
3. Upload **Gambar Cover** (sebaiknya rasio 4:3, misalnya 1600×1200) dan isi deskripsinya.
4. Nyalakan **Unggulan** kalau ingin proyek ini muncul di beranda.
5. Di **Galeri**, klik **Add** tiga kali. Untuk tiap gambar: upload, isi deskripsi, dan (opsional) keterangan.
6. Di **Video YouTube**, klik **Add**, tempel link video, dan beri judul.
7. Tulis cerita proyeknya di **Isi Studi Kasus**: masalah, proses, hasil.
8. Klik **Save**.

📷 *Form proyek baru*

Tips:
- **Urutan** opsional. Isi angka kecil (1, 2, 3) untuk proyek yang ingin tampil paling depan. Kalau kosong, proyek diurutkan dari tahun terbaru.
- Nyalakan **Sembunyikan (draft)** untuk menyimpan proyek yang belum siap tampil.

## 3. Menambah video YouTube

Bisa di proyek (lihat di atas) atau sebagai section di halaman mana pun:

1. Buka halaman yang ingin diberi video (misalnya **Halaman → Beranda**).
2. Di **Section**, klik **Add → Video YouTube**.
3. Tempel link dari YouTube. Semua bentuk link diterima: `youtube.com/watch?v=...`, `youtu.be/...`, `youtube.com/shorts/...`. Link yang memakai waktu mulai (`?t=30`) juga didukung.
4. Isi judul, lalu **Save**.

Catatan:
- Video harus **Public** atau **Unlisted**. Video Private tidak bisa diputar.
- Kalau pemilik video mematikan izin sematan, akan muncul pesan error di player. Di bawah setiap video selalu ada link **Tonton di YouTube** sebagai cadangan.
- Link selain YouTube (Vimeo, Instagram) ditolak.

## 4. Mengubah urutan section

1. Buka halaman (misalnya **Halaman → Beranda**).
2. Di daftar **Section**, tekan dan seret ikon ⠿ di samping section ke posisi baru.
3. Untuk menyembunyikan section sementara tanpa menghapusnya, matikan **Tampilkan**.
4. Klik **Save**.

📷 *Menyeret section*

## 5. Mengganti tema dan warna

1. Buka **Pengaturan Situs → Tema & Animasi**.
2. Pilih **Preset Tema**:

| Preset | Kesan |
| --- | --- |
| Editorial | Majalah, hangat, elegan |
| Minimal Mono | Bersih, banyak ruang kosong |
| Dark Studio | Gelap, kontras, teknis |
| Soft Pastel | Lembut, ramah |
| Bold Brutalist | Berani, grafis |
| Jakarta Modern | Modern, lokal |

3. (Opsional) Ganti **Warna Latar**, **Warna Teks**, atau **Warna Aksen**. Kosongkan untuk memakai warna preset.
4. **Animasi**: Penuh, Halus (hanya memudar), atau Mati.
5. Klik **Save**.

Warna apa pun yang Anda pilih akan **digeser sedikit secara otomatis** bila kurang kontras, supaya teks selalu mudah dibaca (standar WCAG AA). Jadi warna di website bisa sedikit lebih gelap atau terang dari yang dipilih. Ini disengaja.

## 6. Mengatur efek tepi gambar (vignette)

Tersedia di Hero, About Singkat, foto halaman About, dan header halaman custom.

1. Buka section yang punya gambar.
2. Pilih **Efek Tepi Gambar**:
   - **Tanpa efek**: gambar tampil penuh.
   - **Bingkai**: sudut membulat dan garis tipis.
   - **Vignette**: tepi memudar halus menyatu dengan latar.
   - **Pudar bawah**: bagian bawah memudar ke latar.
   - **Vignette gelap**: tepi menggelap seperti lensa kamera.
3. Pilih **Intensitas**: Halus, Sedang, atau Kuat.
4. Klik **Save**.

## 7. Membuat halaman baru dan memasukkannya ke menu

**Langkah A: buat halamannya**

1. Buka **Halaman Custom → New Halaman**.
2. Isi **Judul Halaman**, misalnya "Layanan".
3. Isi **Alamat URL**, misalnya `layanan` (hasilnya `namaweb.com/layanan`). Hanya huruf kecil, angka, dan tanda hubung. Alamat `admin`, `projects`, `about`, `dev`, `uploads`, dan `404` tidak boleh dipakai.
4. (Opsional) Atur **Header Halaman**: teks kecil, sub-judul, dan gambar.
5. Di **Section**, klik **Add** dan pilih section yang dibutuhkan, misalnya Layanan, FAQ, lalu Kontak. Minimal satu section.
6. Pastikan **Sembunyikan (draft)** dalam keadaan mati.
7. Klik **Save**.

📷 *Form halaman custom*

**Langkah B: masukkan ke menu**

1. Buka **Pengaturan Situs → Navigasi (Menu)**.
2. Di **Menu Navbar** (maks. 6 item) atau **Menu Footer** (maks. 10 item), klik **Add**.
3. Isi **Teks Menu**, misalnya "Layanan".
4. Pilih **Jenis Link → Halaman custom**, lalu pilih halamannya di **Halaman Custom**.
5. Seret untuk mengatur urutan, lalu klik **Save**.

📷 *Menambah item menu*

Jenis link lain:
- **Halaman bawaan**: Beranda, Daftar Proyek, About, atau Bagian Kontak.
- **Link luar**: alamat lengkap seperti `https://instagram.com/nama`.

**Penting:** sebelum menghapus halaman atau menjadikannya draft, **hapus dulu link-nya dari menu**. Kalau tidak, website tidak akan diperbarui dan perubahan Anda tertahan sampai link tersebut dihapus.

## Batas teks

Kolom teks dibatasi supaya tampilan tidak rusak. Angka maksimal tertulis di bawah setiap kolom. Contoh: judul hero 80 karakter, ringkasan proyek 160 karakter, teks tombol 30 karakter.

## Kalau ada masalah

| Masalah | Yang dicek |
| --- | --- |
| Perubahan tidak muncul setelah 5 menit | Muat ulang dengan Ctrl+Shift+R. Kalau masih belum, hubungi developer: kemungkinan ada isian yang membuat build gagal. |
| Video tidak bisa diputar | Pastikan video Public/Unlisted dan izin sematan aktif di YouTube Studio. |
| Tidak bisa login | Pastikan akun GitHub Anda sudah diundang ke repo. |
| Halaman baru tidak ada di pilihan menu | Pastikan halaman sudah disimpan dan tidak dalam mode draft. |
