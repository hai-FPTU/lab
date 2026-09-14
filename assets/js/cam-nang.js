/* ==========================================================================
   cam-nang.js — Cẩm nang thực hành An ninh mạng nâng cao

   Ràng buộc kỹ thuật: tệp này phải chạy được khi mở bằng giao thức file,
   tức là khi học viên nhấp đúp vào index.html. Vì vậy KHÔNG dùng fetch,
   XMLHttpRequest hay ES module. Chỉ mục tìm kiếm được nạp sẵn qua thẻ
   script thành biến toàn cục window.CHI_MUC.
   ========================================================================== */
(function () {
  'use strict';

  var giam = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var trangChu = document.body.classList.contains('trang-chu');

  /* ── tiện ích ─────────────────────────────────────────────────────── */
  function boDau(s) {
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D').toLowerCase();
  }
  function thoat(s) {
    return String(s).replace(/[&<>"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c];
    });
  }
  function toSang(van, q) {
    var i = boDau(van).indexOf(q);
    if (i < 0) return thoat(van);
    return thoat(van.slice(0, i)) + '<mark>' + thoat(van.slice(i, i + q.length))
      + '</mark>' + thoat(van.slice(i + q.length));
  }

  /* ── nút sao chép trên từng khối lệnh ─────────────────────────────── */
  document.querySelectorAll('pre').forEach(function (kh) {
    var n = document.createElement('button');
    n.className = 'nut-chep';
    n.type = 'button';
    n.textContent = 'Sao chép';
    n.addEventListener('click', function () {
      var ma = kh.querySelector('code');
      var txt = ma ? ma.innerText : kh.innerText;
      function xong() {
        n.textContent = 'Đã chép';
        n.classList.add('xong');
        setTimeout(function () {
          n.textContent = 'Sao chép';
          n.classList.remove('xong');
        }, 1600);
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(txt).then(xong, chepDuPhong);
      } else {
        chepDuPhong();
      }
      function chepDuPhong() {
        // Một số trình duyệt chặn clipboard khi mở bằng giao thức file.
        var o = document.createElement('textarea');
        o.value = txt;
        o.style.position = 'fixed';
        o.style.opacity = '0';
        document.body.appendChild(o);
        o.select();
        try { document.execCommand('copy'); xong(); } catch (e) { }
        document.body.removeChild(o);
      }
    });
    kh.appendChild(n);
  });

  /* ── tô màu khối trích dẫn theo nhãn ──────────────────────────────── */
  document.querySelectorAll('blockquote').forEach(function (b) {
    var t = (b.textContent || '').slice(0, 60).toUpperCase();
    if (t.indexOf('GHI NHỚ') >= 0 || t.indexOf('ĐIỂM CẦN NHỚ') >= 0 ||
      t.indexOf('ĐIỂM QUAN TRỌNG') >= 0 || t.indexOf('ĐIỂM DẠY HỌC') >= 0) {
      b.classList.add('ghi-nho');
    } else if (t.indexOf('CẢNH BÁO') >= 0 || t.indexOf('LƯU HÀNH') >= 0) {
      b.classList.add('canh-bao');
    }
  });

  /* ── tìm kiếm toàn cẩm nang ───────────────────────────────────────── */
  var goc = trangChu ? 'phan/' : '';
  function timKiem(q) {
    if (!window.CHI_MUC || q.length < 2) return [];
    var qq = boDau(q), diem = [];
    for (var i = 0; i < window.CHI_MUC.length; i++) {
      var m = window.CHI_MUC[i];
      var vt = boDau(m.t).indexOf(qq);
      if (vt >= 0) {
        diem.push({ m: m, d: (vt === 0 ? 0 : 1) + (m.c === 0 ? 2 : m.c) });
      } else if (m.v && boDau(m.v).indexOf(qq) >= 0) {
        diem.push({ m: m, d: 9 });
      }
    }
    diem.sort(function (a, b) { return a.d - b.d; });
    return diem.slice(0, 14).map(function (x) { return x.m; });
  }

  function noiKq(oTim, oKq) {
    if (!oTim || !oKq) return;
    oTim.addEventListener('input', function () {
      var q = oTim.value.trim();
      oKq.innerHTML = '';
      oTim.classList.remove('trong-rong');
      if (q.length < 2) return;
      var kq = timKiem(q);
      if (!kq.length) { oTim.classList.add('trong-rong'); return; }
      kq.forEach(function (m) {
        var a = document.createElement('a');
        a.href = goc + m.p + (m.id ? '#' + m.id : '');
        a.innerHTML = toSang(m.t, boDau(q)) +
          '<span class="kq-phan">' + thoat(m.pt) + '</span>';
        oKq.appendChild(a);
      });
    });
  }
  noiKq(document.getElementById('o-tim'), document.getElementById('kq-tim'));
  noiKq(document.getElementById('o-tim-bia'), document.getElementById('kq-tim-bia'));

  if (trangChu) {
    var oBia = document.getElementById('o-tim-bia');
    if (oBia) oBia.focus();
    return;   // trang chủ không cần các phần bên dưới
  }


  /* ══════════════════ BIỂU MẪU LÀM BÀI ══════════════════════════════
     Không dùng localStorage. Học viên lưu bài bằng cách tải file JSON về,
     nạp lại bằng hộp chọn file. Cách này chạy được trên mọi trình duyệt,
     kể cả khi mở bằng giao thức file.                                   */

  function bmTen(bm) {
    var h = bm.querySelector('h4');
    return h ? h.textContent.replace(/^.*·\s*/, '').trim() : 'bai-lam';
  }
  function khongDau(s) {
    return String(s).normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/đ/g, 'd').replace(/Đ/g, 'D')
      .replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
  }
  function taiVe(ten, noi, loai) {
    var b = new Blob(['\ufeff' + noi], { type: loai });
    var u = URL.createObjectURL(b);
    var a = document.createElement('a');
    a.href = u; a.download = ten;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(u); }, 2000);
  }
  function baoXong(nut, chu) {
    var cu = nut.textContent;
    nut.textContent = chu; nut.classList.add('xong');
    setTimeout(function () { nut.textContent = cu; nut.classList.remove('xong'); }, 1700);
  }

  /* ── tính toán tự động ─────────────────────────────────────────── */
  function tinhDong(tr) {
    var o = tr.querySelectorAll('.bm-tinh');
    if (!o.length) return;
    var so = tr.querySelectorAll('input[type=number]');
    var a = so[0] ? parseInt(so[0].value, 10) : NaN;
    var b = so[1] ? parseInt(so[1].value, 10) : NaN;
    o.forEach(function (td) {
      var ct = td.dataset.ct;
      if (ct === 'nhan') {
        td.textContent = (isNaN(a) || isNaN(b)) ? '' : (a * b);
      } else if (ct === 'nhom') {
        td.className = 'bm-tinh';
        if (isNaN(a) || isNaN(b)) { td.textContent = ''; return; }
        var v = a * b;
        if (v >= 15) { td.textContent = 'Xử lý bắt buộc'; td.classList.add('bat-buoc'); }
        else if (v >= 8) { td.textContent = 'Xử lý có kế hoạch'; td.classList.add('ke-hoach'); }
        else { td.textContent = 'Chấp nhận có ghi nhận'; td.classList.add('chap-nhan'); }
      }
    });
  }

  function phut(s) {
    var m = String(s || '').trim().match(/^(\d{1,2})\D(\d{1,2})(?:\D(\d{1,2}))?$/);
    if (!m) return null;
    return (+m[1]) * 3600 + (+m[2]) * 60 + (m[3] ? +m[3] : 0);
  }
  function dinhDang(giay) {
    if (giay < 0) giay += 86400;
    var g = Math.floor(giay / 3600), p = Math.floor((giay % 3600) / 60);
    return (g ? g + ' giờ ' : '') + p + ' phút';
  }

  function tinhTong(bm) {
    var oTong = bm.querySelector('.bm-tong');
    if (!oTong) return;
    var kieu = bm.dataset.kieu;

    if (kieu === 'rtorpo') {
      var v = [];
      bm.querySelectorAll('tbody tr').forEach(function (tr) {
        var i = tr.querySelector('textarea[data-k="Thời điểm"]');
        v.push(i ? phut(i.value) : null);
      });
      if (v[0] != null && v[1] != null && v[3] != null) {
        oTong.innerHTML = '<b>RPO</b> = mốc 2 trừ mốc 1 = <b>' + dinhDang(v[1] - v[0]) +
          '</b> &nbsp;·&nbsp; <b>RTO</b> = mốc 4 trừ mốc 2 = <b>' + dinhDang(v[3] - v[1]) + '</b>';
      } else {
        oTong.innerHTML = '<span class="cb">Nhập đủ mốc 1, 2 và 4 theo dạng 10:26:00 để tự tính.</span>';
      }
      return;
    }

    if (kieu === 'luoi') {
      var muc = ['Truyền thống', 'Khởi đầu', 'Nâng cao', 'Tối ưu'], yeu = [], da = 0;
      bm.querySelectorAll('tbody tr').forEach(function (tr) {
        var ch = tr.querySelector('input[type=radio]:checked');
        var ten = tr.querySelector('.ten-hang b').textContent;
        if (ch) { da++; if (muc.indexOf(ch.value) <= 1) yeu.push(ten); }
      });
      var t = 'Đã chấm <b>' + da + '</b> trên 5 trụ cột.';
      if (yeu.length) t += ' Trụ cột yếu nhất: <span class="cb">' + yeu.join(', ') + '</span>.';
      else if (da === 5) t += ' Không trụ cột nào ở hai mức thấp.';
      oTong.innerHTML = t;
      return;
    }

    var dem = { 'Xử lý bắt buộc': 0, 'Xử lý có kế hoạch': 0, 'Chấp nhận có ghi nhận': 0 };
    var coDiem = false, soDong = 0;
    bm.querySelectorAll('tbody tr').forEach(function (tr) {
      var oNhom = tr.querySelector('.bm-tinh[data-ct="nhom"]');
      if (oNhom && oNhom.textContent) { dem[oNhom.textContent]++; coDiem = true; }
      var coND = Array.prototype.some.call(tr.querySelectorAll('textarea,select,input'),
        function (e) { return e.value && e.value.trim(); });
      if (coND) soDong++;
    });
    if (coDiem) {
      oTong.innerHTML = 'Đã điền <b>' + soDong + '</b> dòng · ' +
        '<span class="cb">Xử lý bắt buộc: ' + dem['Xử lý bắt buộc'] + '</span> · ' +
        'Xử lý có kế hoạch: ' + dem['Xử lý có kế hoạch'] + ' · ' +
        'Chấp nhận: ' + dem['Chấp nhận có ghi nhận'];
    } else {
      oTong.innerHTML = soDong ? 'Đã điền <b>' + soDong + '</b> dòng.' : '';
    }
  }

  /* ── thu thập và nạp dữ liệu ───────────────────────────────────── */
  function thuThap(bm) {
    var dong = [];
    bm.querySelectorAll('tbody tr').forEach(function (tr) {
      var o = {};
      var ma = tr.querySelector('.bm-ma');
      if (ma) o['__nhan'] = ma.textContent;
      var th = tr.querySelector('.ten-hang b');
      if (th) o['__nhan'] = th.textContent;
      tr.querySelectorAll('[data-k]').forEach(function (e) {
        if (e.type === 'radio') { if (e.checked) o[e.dataset.k] = e.value; }
        else if (e.classList.contains('bm-tinh')) o[e.dataset.k] = e.textContent;
        else o[e.dataset.k] = e.value;
      });
      dong.push(o);
    });
    return { bieu_mau: bm.dataset.bm, ten: bmTen(bm), thoi_diem: new Date().toISOString(), dong: dong };
  }

  function nap(bm, dl) {
    var trs = bm.querySelectorAll('tbody tr');
    (dl.dong || []).forEach(function (o, i) {
      while (i >= bm.querySelectorAll('tbody tr').length) themDong(bm);
      var tr = bm.querySelectorAll('tbody tr')[i];
      tr.querySelectorAll('[data-k]').forEach(function (e) {
        var v = o[e.dataset.k];
        if (v === undefined) return;
        if (e.type === 'radio') e.checked = (e.value === v);
        else if (!e.classList.contains('bm-tinh')) e.value = v;
      });
      tinhDong(tr);
    });
    tinhTong(bm);
  }

  /* ── xuất ra Word và PDF ───────────────────────────────────────── */
  function bangHTML(bm) {
    var b = bm.querySelector('table.bm-bang').cloneNode(true);
    b.querySelectorAll('textarea,input,select').forEach(function (e) {
      var v = '';
      if (e.tagName === 'SELECT') v = e.value;
      else if (e.type === 'radio') { if (e.checked) v = '✔'; }
      else v = e.value;
      var td = document.createElement('span');
      td.textContent = v;
      e.parentNode.replaceChild(td, e);
    });
    return b.outerHTML;
  }

  function xuatWord(bm) {
    var ten = bmTen(bm);
    var noi = '<html xmlns:o="urn:schemas-microsoft-com:office:office" ' +
      'xmlns:w="urn:schemas-microsoft-com:office:word" ' +
      'xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="utf-8">' +
      '<title>' + ten + '</title><style>' +
      'body{font-family:Calibri,Arial,sans-serif;font-size:11pt}' +
      'h1{font-size:15pt;color:#16202A;border-bottom:2px solid #A31621;padding-bottom:6px}' +
      '.meta{font-size:9pt;color:#6E7A87;margin-bottom:14px}' +
      'table{border-collapse:collapse;width:100%;font-size:9.5pt}' +
      'th{background:#16202A;color:#fff;padding:6px;text-align:left}' +
      'td{border:1px solid #CFD7DE;padding:5px;vertical-align:top}' +
      '@page{size:A4 landscape;margin:1.6cm}' +
      '</style></head><body>' +
      '<h1>' + ten + '</h1>' +
      '<p class="meta">Khoá An ninh mạng nâng cao · Công ty Minh An · ' +
      'Xuất lúc ' + new Date().toLocaleString('vi-VN') + '</p>' +
      '<p><b>Họ và tên học viên:</b> ............................................. &nbsp;&nbsp; ' +
      '<b>Đơn vị:</b> .............................................</p>' +
      bangHTML(bm) +
      '<p style="margin-top:16px;font-size:9.5pt">' +
      (bm.querySelector('.bm-tong').textContent || '') + '</p>' +
      '</body></html>';
    taiVe(khongDau(ten) + '.doc', noi, 'application/msword');
  }

  function xuatPDF(bm) {
    var ten = bmTen(bm);
    var w = window.open('', '_blank');
    if (!w) { alert('Trình duyệt chặn cửa sổ mới. Cho phép rồi thử lại.'); return; }
    w.document.write('<!DOCTYPE html><html lang="vi"><head><meta charset="utf-8">' +
      '<title>' + ten + '</title><style>' +
      'body{font-family:Segoe UI,system-ui,sans-serif;font-size:11pt;margin:22px;color:#39444F}' +
      'h1{font-size:17pt;color:#16202A;border-bottom:3px solid #A31621;padding-bottom:7px}' +
      '.meta{font-size:9.5pt;color:#6E7A87}' +
      'table{border-collapse:collapse;width:100%;font-size:9.5pt;margin-top:12px}' +
      'th{background:#16202A;color:#fff;padding:7px;text-align:left}' +
      'td{border:1px solid #CFD7DE;padding:6px;vertical-align:top}' +
      '@page{size:A4 landscape;margin:14mm}' +
      '</style></head><body>' +
      '<h1>' + ten + '</h1><p class="meta">Khoá An ninh mạng nâng cao · Công ty Minh An · ' +
      new Date().toLocaleString('vi-VN') + '</p>' +
      '<p><b>Họ và tên:</b> ....................................... &nbsp; ' +
      '<b>Đơn vị:</b> .......................................</p>' +
      bangHTML(bm) +
      '<p style="margin-top:14px">' + (bm.querySelector('.bm-tong').textContent || '') + '</p>' +
      '</body></html>');
    w.document.close();
    setTimeout(function () { w.focus(); w.print(); }, 400);
  }

  function themDong(bm) {
    var tb = bm.querySelector('tbody');
    var moi = tb.rows[tb.rows.length - 1].cloneNode(true);
    moi.querySelectorAll('textarea,input').forEach(function (e) {
      if (e.type === 'radio') e.checked = false; else e.value = '';
    });
    moi.querySelectorAll('select').forEach(function (e) { e.selectedIndex = 0; });
    moi.querySelectorAll('.bm-tinh').forEach(function (e) {
      e.textContent = ''; e.className = 'bm-tinh';
    });
    var stt = moi.querySelector('td.stt');
    if (stt) stt.textContent = tb.rows.length + 1;
    var ma = moi.querySelector('td.bm-ma');
    if (ma) ma.textContent = '';
    tb.appendChild(moi);
    return moi;
  }

  /* ── gắn sự kiện cho mọi biểu mẫu trên trang ───────────────────── */
  document.querySelectorAll('section.bm').forEach(function (bm) {
    bm.addEventListener('input', function (e) {
      var tr = e.target.closest('tr');
      if (tr) tinhDong(tr);
      tinhTong(bm);
    });
    bm.addEventListener('change', function () { tinhTong(bm); });

    var nThem = bm.querySelector('.bm-them');
    if (nThem) nThem.addEventListener('click', function () { themDong(bm); });

    bm.querySelector('.bm-luu').addEventListener('click', function () {
      taiVe(khongDau(bmTen(bm)) + '.json',
        JSON.stringify(thuThap(bm), null, 2), 'application/json');
      baoXong(this, 'Đã tải về');
    });

    bm.querySelector('.bm-nap').addEventListener('click', function () {
      var nut = this;
      var inp = document.createElement('input');
      inp.type = 'file'; inp.accept = '.json,application/json';
      inp.addEventListener('change', function () {
        var f = inp.files[0];
        if (!f) return;
        var fr = new FileReader();
        fr.onload = function () {
          try {
            var dl = JSON.parse(fr.result);
            if (dl.bieu_mau && dl.bieu_mau !== bm.dataset.bm) {
              alert('File này là bài làm của biểu mẫu khác: ' + dl.ten);
              return;
            }
            nap(bm, dl);
            baoXong(nut, 'Đã nạp');
          } catch (err) { alert('Không đọc được file. Hãy chọn đúng file JSON đã lưu.'); }
        };
        fr.readAsText(f, 'utf-8');
      });
      inp.click();
    });

    bm.querySelector('.bm-word').addEventListener('click', function () {
      xuatWord(bm); baoXong(this, 'Đã tải về');
    });
    bm.querySelector('.bm-pdf').addEventListener('click', function () { xuatPDF(bm); });
    bm.querySelector('.bm-xoa').addEventListener('click', function () {
      if (!confirm('Xoá toàn bộ nội dung đã điền trong biểu mẫu này?')) return;
      bm.querySelectorAll('textarea,input').forEach(function (e) {
        if (e.type === 'radio') e.checked = false; else e.value = '';
      });
      bm.querySelectorAll('select').forEach(function (e) { e.selectedIndex = 0; });
      bm.querySelectorAll('.bm-tinh').forEach(function (e) {
        e.textContent = ''; e.className = 'bm-tinh';
      });
      tinhTong(bm);
    });

    tinhTong(bm);
  });

  /* ── thanh tiến độ đọc ────────────────────────────────────────────── */
  var tien = document.getElementById('tien-do');
  function veTienDo() {
    var h = document.documentElement;
    var toiDa = (h.scrollHeight - h.clientHeight) || 1;
    tien.style.width = Math.min(100, (h.scrollTop / toiDa) * 100) + '%';
  }
  window.addEventListener('scroll', veTienDo, { passive: true });
  window.addEventListener('resize', veTienDo);
  veTienDo();

  /* ── nội dung hiện dần khi cuộn tới ───────────────────────────────── */
  if (!giam && 'IntersectionObserver' in window) {
    var canHien = document.querySelectorAll(
      '#than h1, #than h2, #than table, #than pre, #than blockquote, #than figure');
    canHien.forEach(function (e) { e.classList.add('hien-dan'); });
    var bat = new IntersectionObserver(function (muc) {
      muc.forEach(function (m) {
        if (m.isIntersecting) { m.target.classList.add('vao'); bat.unobserve(m.target); }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .05 });
    canHien.forEach(function (e) { bat.observe(e); });
    setTimeout(function () {
      canHien.forEach(function (e) {
        if (e.getBoundingClientRect().top < window.innerHeight) e.classList.add('vao');
      });
    }, 60);
  }

  /* ── đánh dấu mục đang xem ────────────────────────────────────────── */
  var lienMl = Array.prototype.slice.call(document.querySelectorAll('#ml a.ml-chuong'));
  if ('IntersectionObserver' in window && lienMl.length) {
    var tieuDe = Array.prototype.slice.call(
      document.querySelectorAll('#than h1[id], #than h2[id]'));
    var theoDoi = new IntersectionObserver(function (muc) {
      muc.forEach(function (m) {
        if (!m.isIntersecting) return;
        var id = m.target.id;
        lienMl.forEach(function (a) {
          a.classList.toggle('dang-xem', a.dataset.id === id);
        });
      });
    }, { rootMargin: '0px 0px -78% 0px', threshold: 0 });
    tieuDe.forEach(function (h) { theoDoi.observe(h); });
  }

  /* ── bấm hình để xem phóng to ─────────────────────────────────────── */
  var lop = document.getElementById('lop-phu');
  document.querySelectorAll('figure.so-do img').forEach(function (im) {
    im.addEventListener('click', function () {
      lop.innerHTML = '';
      var to = document.createElement('img');
      to.src = im.src;
      to.alt = im.alt;
      lop.appendChild(to);
      lop.classList.add('mo');
    });
  });
  if (lop) lop.addEventListener('click', function () { lop.classList.remove('mo'); });

  /* ── nút lên đầu trang ────────────────────────────────────────────── */
  var len = document.getElementById('len');
  window.addEventListener('scroll', function () {
    len.classList.toggle('hien', window.scrollY > 600);
  }, { passive: true });
  len.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: giam ? 'auto' : 'smooth' });
  });

  /* ── thanh bên trên màn hình hẹp ──────────────────────────────────── */
  var canh = document.getElementById('canh');
  var nutCanh = document.getElementById('nut-canh');
  if (nutCanh) {
    nutCanh.addEventListener('click', function () { canh.classList.toggle('mo'); });
  }
  document.querySelectorAll('#ml a, #kq-tim a').forEach(function (a) {
    a.addEventListener('click', function () { canh.classList.remove('mo'); });
  });

  /* ── phím tắt ─────────────────────────────────────────────────────── */
  var oTim = document.getElementById('o-tim');
  document.addEventListener('keydown', function (e) {
    if (e.key === '/' && document.activeElement !== oTim) {
      e.preventDefault(); canh.classList.add('mo'); oTim.focus();
    }
    if (e.key === 'Escape') {
      if (lop) lop.classList.remove('mo');
      if (oTim) {
        oTim.value = '';
        oTim.dispatchEvent(new Event('input'));
        oTim.blur();
      }
    }
    // mũi tên trái và phải để chuyển phần, khi không đang gõ trong ô nhập
    if (document.activeElement.tagName === 'INPUT') return;
    if (e.key === 'ArrowLeft') {
      var t = document.querySelector('nav.dieu-huong .truoc');
      if (t) window.location.href = t.getAttribute('href');
    }
    if (e.key === 'ArrowRight') {
      var s = document.querySelector('nav.dieu-huong .sau');
      if (s) window.location.href = s.getAttribute('href');
    }
  });

  /* ── cuộn mục lục tới mục đang xem sau khi trang tải xong ─────────── */
  window.addEventListener('load', function () {
    var dang = document.querySelector('#ml a.ml-phan.dang-xem');
    if (dang) dang.scrollIntoView({ block: 'center' });
  });
})();
