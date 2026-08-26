/* THE LULLABY PLAYER — built for the end of the day, not for a music app.

   Two things a bedtime player needs that an ordinary one does not:

     REPEAT   two and a half minutes is not long enough to get a child to
              sleep. Left on repeat it just keeps going.
     A TIMER  and because it keeps going, something has to stop it. Pick
              twenty minutes and it stops at twenty minutes.

   THE FADE IS THE WHOLE POINT OF THE TIMER. Music that cuts out abruptly in
   a dark room wakes the child it just got to sleep. So the last thirty
   seconds fade down to nothing, and by the time it stops there was nothing
   left to hear. If you ever change the timer, keep the fade.

   Everything is remembered per device — a family that wants repeat and
   twenty minutes wants that every night, not once.

   Mount with:
     LSTPlayer.mount(hostElement, { src: "…mp3", title: "…" })
*/
(function () {
  var MINUTES = [0, 10, 20, 30, 45, 60];   /* 0 = no timer */
  var FADE_SECONDS = 30;

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function remembered(key, fallback) {
    try {
      var v = localStorage.getItem("lst:play:" + key);
      return v === null ? fallback : JSON.parse(v);
    } catch (e) { return fallback; }
  }
  function remember(key, value) {
    try { localStorage.setItem("lst:play:" + key, JSON.stringify(value)); } catch (e) {}
  }

  function clock(sec) {
    sec = Math.max(0, Math.round(sec));
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  function mount(host, opts) {
    host = typeof host === "string" ? document.getElementById(host) : host;
    if (!host || !opts || !opts.src) { if (host) host.innerHTML = ""; return null; }

    var repeat = !!remembered("repeat", true);      /* a lullaby wants to repeat */
    var minutes = remembered("minutes", 20);
    if (MINUTES.indexOf(minutes) === -1) minutes = 20;

    var audio = new Audio();
    audio.preload = "none";                          /* nothing downloads until asked */
    audio.src = opts.src;
    audio.loop = repeat;

    var endsAt = null;        /* when the timer runs out, in ms */
    var tick = null;
    var fading = false;

    host.innerHTML =
      '<div class="pl">' +
        '<div class="pl-row">' +
          '<button type="button" class="pl-play" aria-label="Play">&#9654;</button>' +
          '<div class="pl-mid">' +
            '<div class="pl-title">' + esc(opts.title || "Lullaby") + "</div>" +
            '<input class="pl-seek" type="range" min="0" max="1000" value="0" ' +
              'aria-label="Position in the lullaby">' +
            '<div class="pl-time"><span class="pl-at">0:00</span>' +
              '<span class="pl-left"></span></div>' +
          "</div>" +
        "</div>" +
        '<div class="pl-opts">' +
          '<button type="button" class="pl-chip pl-repeat" aria-pressed="' + repeat + '">' +
            "&#128257; Repeat</button>" +
          '<span class="pl-sep"></span>' +
          '<span class="pl-lbl">Stop after</span>' +
          MINUTES.map(function (m) {
            return '<button type="button" class="pl-chip pl-min" data-min="' + m + '">' +
              (m ? m + " min" : "Don&rsquo;t stop") + "</button>";
          }).join("") +
        "</div>" +
      "</div>";

    var el = {
      play:   host.querySelector(".pl-play"),
      seek:   host.querySelector(".pl-seek"),
      at:     host.querySelector(".pl-at"),
      left:   host.querySelector(".pl-left"),
      repeat: host.querySelector(".pl-repeat"),
      mins:   [].slice.call(host.querySelectorAll(".pl-min"))
    };

    function paintOptions() {
      el.repeat.classList.toggle("on", repeat);
      el.repeat.setAttribute("aria-pressed", String(repeat));
      el.mins.forEach(function (b) {
        b.classList.toggle("on", parseInt(b.getAttribute("data-min"), 10) === minutes);
      });
    }

    function stopTimer() {
      endsAt = null; fading = false;
      audio.volume = 1;
      el.left.textContent = "";
    }

    function startTimer() {
      if (!minutes) { stopTimer(); return; }
      endsAt = Date.now() + minutes * 60000;
      fading = false;
      audio.volume = 1;
    }

    /* Runs about four times a second while it is playing: moves the bar,
       counts the timer down, and handles the fade at the end. */
    function frame() {
      if (audio.duration) {
        el.seek.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
        el.at.textContent = clock(audio.currentTime);
      }
      if (endsAt) {
        var leftMs = endsAt - Date.now();
        if (leftMs <= 0) {
          audio.pause();
          stopTimer();
          paintPlay();
          return;
        }
        el.left.textContent = clock(leftMs / 1000) + " left";
        /* The last thirty seconds come down gently, so the room goes quiet
           rather than going silent. */
        var fadeMs = FADE_SECONDS * 1000;
        if (leftMs < fadeMs) {
          fading = true;
          audio.volume = Math.max(0, leftMs / fadeMs);
        } else if (fading) {
          fading = false; audio.volume = 1;
        }
      }
    }

    function paintPlay() {
      var on = !audio.paused;
      el.play.innerHTML = on ? "&#10074;&#10074;" : "&#9654;";
      el.play.setAttribute("aria-label", on ? "Pause" : "Play");
      host.querySelector(".pl").classList.toggle("playing", on);
      if (on && !tick) tick = setInterval(frame, 250);
      if (!on && tick) { clearInterval(tick); tick = null; }
    }

    el.play.addEventListener("click", function () {
      if (audio.paused) {
        audio.play().then(function () {
          startTimer();
          paintPlay();
        }).catch(function () {
          el.left.textContent = "This browser wouldn't play it.";
        });
      } else {
        audio.pause();
        stopTimer();
        paintPlay();
      }
    });

    el.seek.addEventListener("input", function () {
      if (audio.duration) audio.currentTime = (this.value / 1000) * audio.duration;
    });

    el.repeat.addEventListener("click", function () {
      repeat = !repeat;
      audio.loop = repeat;
      remember("repeat", repeat);
      paintOptions();
    });

    el.mins.forEach(function (b) {
      b.addEventListener("click", function () {
        minutes = parseInt(this.getAttribute("data-min"), 10) || 0;
        remember("minutes", minutes);
        paintOptions();
        if (!audio.paused) startTimer(); else stopTimer();
      });
    });

    audio.addEventListener("ended", function () {
      /* Only reached when repeat is off — with it on the browser loops. */
      stopTimer(); paintPlay();
    });
    audio.addEventListener("pause", paintPlay);
    audio.addEventListener("play", paintPlay);

    /* Never leave a lullaby playing to an empty room. */
    window.addEventListener("pagehide", function () { audio.pause(); });

    paintOptions();
    paintPlay();

    var api = { audio: audio, stop: function () { audio.pause(); stopTimer(); paintPlay(); } };
    /* Hung on the element so the page that mounted it can stop it, and so the
       fade can be measured from outside rather than taken on trust. */
    host.__player = api;
    return api;
  }

  window.LSTPlayer = { mount: mount };
})();
