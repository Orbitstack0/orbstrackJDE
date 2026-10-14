(function () {
  "use strict";

  /* ---------------------------------------------------------
     CONFIGURAÇÃO — WHATSAPP (centralizado)
     Número oficial do Henrique (+55 48 98814-6753), só dígitos com
     DDI. Usado pelo botão flutuante (contato direto) e pela
     experiência de contato (seleção + formulário).
  --------------------------------------------------------- */
  var WHATSAPP_NUMERO = "5548988146753";

  var WHATSAPP_MENSAGENS = {
    flutuante: "Olá! Vim pelo site da Jogador de Elite e gostaria de saber mais."
  };

  function buildWhatsappUrl(mensagem) {
    return "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + encodeURIComponent(mensagem);
  }

  var WHATSAPP_FLUTUANTE = buildWhatsappUrl(WHATSAPP_MENSAGENS.flutuante);

  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------------------------------------------------
     Header: fundo escuro + blur ao rolar
  --------------------------------------------------------- */
  var header = document.getElementById("site-header");

  function updateHeaderState() {
    if (window.scrollY > 24) {
      header.classList.add("scrolled");
    } else {
      header.classList.remove("scrolled");
    }
  }
  updateHeaderState();
  window.addEventListener("scroll", updateHeaderState, { passive: true });

  /* ---------------------------------------------------------
     Menu mobile
  --------------------------------------------------------- */
  var menuToggle = document.getElementById("menu-toggle");
  var mobileNav = document.getElementById("mobile-nav");

  function closeMobileNav() {
    mobileNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
  }

  function toggleMobileNav() {
    var isOpen = mobileNav.classList.toggle("open");
    menuToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  }

  menuToggle.addEventListener("click", toggleMobileNav);

  mobileNav.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", closeMobileNav);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") closeMobileNav();
  });

  /* ---------------------------------------------------------
     Animações de entrada (reveal) via IntersectionObserver
  --------------------------------------------------------- */
  var revealEls = document.querySelectorAll(".reveal");

  if (prefersReducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("in-view"); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -8% 0px" }
    );

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ---------------------------------------------------------
     Modal de vídeo (seção Vídeos)
     Estrutura preparada para /videos/*.mp4 reais.
     O vídeo só carrega após clique; se o arquivo ainda não
     existir, mostramos um aviso "em breve" em vez de quebrar.
  --------------------------------------------------------- */
  var videoModal = document.getElementById("video-modal");
  var videoModalBody = document.getElementById("video-modal-body");
  var videoCards = document.querySelectorAll(".video-card");
  var lastVideoTrigger = null;

  function openVideoModal(src, title, triggerEl) {
    if (!videoModal || !videoModalBody) return;
    lastVideoTrigger = triggerEl || null;

    videoModalBody.innerHTML = "";
    var video = document.createElement("video");
    video.setAttribute("controls", "");
    video.setAttribute("playsinline", "");
    video.setAttribute("aria-label", title || "Vídeo");
    video.src = src;

    video.addEventListener("error", function () {
      videoModalBody.innerHTML = '<p class="video-modal-fallback">Não foi possível reproduzir este vídeo no navegador.</p>';
    });

    videoModalBody.appendChild(video);

    videoModal.classList.add("open");
    videoModal.setAttribute("aria-hidden", "false");
    document.body.classList.add("modal-open");

    video.play().catch(function () { /* autoplay pode ser bloqueado; controles seguem disponíveis */ });

    var closeBtn = videoModal.querySelector(".video-modal-close");
    if (closeBtn) closeBtn.focus();
  }

  function closeVideoModal() {
    if (!videoModal || !videoModalBody) return;

    var video = videoModalBody.querySelector("video");
    if (video) {
      video.pause();
      video.removeAttribute("src");
      video.load();
    }
    videoModalBody.innerHTML = "";

    videoModal.classList.remove("open");
    videoModal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("modal-open");

    if (lastVideoTrigger) lastVideoTrigger.focus();
  }

  videoCards.forEach(function (card) {
    card.addEventListener("click", function () {
      var src = card.getAttribute("data-video-src");
      var title = card.getAttribute("data-video-title");
      openVideoModal(src, title, card);
    });
  });

  if (videoModal) {
    videoModal.querySelectorAll("[data-close-modal]").forEach(function (el) {
      el.addEventListener("click", closeVideoModal);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && videoModal.classList.contains("open")) {
        closeVideoModal();
      }
      if (e.key === "Tab" && videoModal.classList.contains("open")) {
        var focusable = videoModal.querySelectorAll('button, [href], video, [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  /* ---------------------------------------------------------
     Slider de depoimentos (seção Resultados reais)
     Setas + pontinhos + teclado (com o slider em foco) + swipe.
     Autoplay contínuo, pausa no hover e some com prefers-reduced-motion.
  --------------------------------------------------------- */
  var depoimentosSlider = document.getElementById("depoimentos-slider");
  var depoimentosList = document.getElementById("depoimentos-list");

  if (depoimentosSlider && depoimentosList) {
    var depoimentosSlides = depoimentosList.querySelectorAll(".depoimento-slide");
    var depoimentosDots = depoimentosSlider.querySelectorAll(".depoimentos-dot");
    var depoimentosArrows = depoimentosSlider.querySelectorAll(".depoimentos-arrow");
    var depoimentoIndex = 0;
    var depoimentoTotal = depoimentosSlides.length;

    /* A11y: rótulo "n de total" por slide (total real) e aria-hidden nos inativos. */
    depoimentosSlides.forEach(function (slide, i) {
      slide.setAttribute("aria-label", (i + 1) + " de " + depoimentoTotal);
      slide.setAttribute("aria-hidden", i === 0 ? "false" : "true");
    });

    function goToDepoimento(index) {
      if (!depoimentoTotal) return;
      depoimentoIndex = ((index % depoimentoTotal) + depoimentoTotal) % depoimentoTotal;

      depoimentosList.style.transform = "translateX(-" + (depoimentoIndex * 100) + "%)";

      depoimentosSlides.forEach(function (slide, i) {
        slide.classList.toggle("is-active", i === depoimentoIndex);
        slide.setAttribute("aria-hidden", i === depoimentoIndex ? "false" : "true");
      });
      depoimentosDots.forEach(function (dot, i) {
        var isActive = i === depoimentoIndex;
        dot.classList.toggle("is-active", isActive);
        if (isActive) { dot.setAttribute("aria-current", "true"); } else { dot.removeAttribute("aria-current"); }
      });
    }

    /* Autoplay: troca sozinho a cada ~4.5s, pausa no hover/foco e respeita reduced-motion */
    var AUTOPLAY_DELAY = 7000;
    var autoplayTimer = null;
    var reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }

    function startAutoplay() {
      if (reducedMotionQuery.matches || depoimentoTotal < 2) return;
      stopAutoplay();
      autoplayTimer = setInterval(function () {
        goToDepoimento(depoimentoIndex + 1);
      }, AUTOPLAY_DELAY);
    }

    function restartAutoplay() {
      stopAutoplay();
      startAutoplay();
    }

    depoimentosDots.forEach(function (dot, i) {
      dot.addEventListener("click", function () {
        goToDepoimento(i);
        restartAutoplay();
      });
    });

    depoimentosArrows.forEach(function (arrow) {
      arrow.addEventListener("click", function () {
        goToDepoimento(depoimentoIndex + parseInt(arrow.getAttribute("data-dir"), 10));
        restartAutoplay();
      });
    });

    /* Teclado: setas funcionam quando o slider (ou algo dentro dele) está em foco */
    depoimentosSlider.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        goToDepoimento(depoimentoIndex + 1);
        restartAutoplay();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        goToDepoimento(depoimentoIndex - 1);
        restartAutoplay();
      }
    });

    /* Swipe (touch e pointer) */
    var swipeStartX = null;
    var swipeStartY = null;
    var swipeActive = false;

    depoimentosList.addEventListener("touchstart", function (e) {
      var t = e.touches[0];
      swipeStartX = t.clientX;
      swipeStartY = t.clientY;
      swipeActive = true;
    }, { passive: true });

    depoimentosList.addEventListener("touchend", function (e) {
      if (!swipeActive || swipeStartX === null) return;
      swipeActive = false;

      var t = e.changedTouches[0];
      var deltaX = t.clientX - swipeStartX;
      var deltaY = t.clientY - swipeStartY;

      if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
        if (deltaX < 0) {
          goToDepoimento(depoimentoIndex + 1);
        } else {
          goToDepoimento(depoimentoIndex - 1);
        }
        restartAutoplay();
      }
      swipeStartX = null;
      swipeStartY = null;
    });

    /* Pausa no hover (desktop) e no foco via teclado; retoma ao sair */
    depoimentosSlider.addEventListener("mouseenter", stopAutoplay);
    depoimentosSlider.addEventListener("mouseleave", startAutoplay);
    depoimentosSlider.addEventListener("focusin", stopAutoplay);
    depoimentosSlider.addEventListener("focusout", startAutoplay);

    if (typeof reducedMotionQuery.addEventListener === "function") {
      reducedMotionQuery.addEventListener("change", restartAutoplay);
    }

    startAutoplay();
  }

  /* ---------------------------------------------------------
     Carrossel de clubes (seção Experiência) — mobile/tablet
     Marquee CSS contínuo, puramente visual: não pausa, não
     responde a toque/clique/arrasto (ver pointer-events/user-
     select no CSS). Os 4 itens originais são movidos para dentro
     de uma trilha interna (.trajetoria-track, criada aqui)
     seguidos de uma cópia da mesma sequência; o CSS anima essa
     trilha em loop (translateX 0 até a distância medida abaixo).
     Só ativa abaixo de 1280px e nunca com reduced-motion (nesse
     caso a fileira original fica estática e acessível).
  --------------------------------------------------------- */
  var trajetoriaTrack = document.getElementById("trajetoria-timeline");

  if (trajetoriaTrack) {
    var trajetoriaMedia = window.matchMedia("(max-width: 1279px)");
    var trajetoriaInner = null;

    function trajetoriaSetupMarquee() {
      if (prefersReducedMotion || !trajetoriaMedia.matches || trajetoriaInner) return;

      var originalItems = trajetoriaTrack.querySelectorAll(".trajetoria-item");
      if (!originalItems.length) return;

      var inner = document.createElement("div");
      inner.className = "trajetoria-track";

      originalItems.forEach(function (item) {
        inner.appendChild(item);
      });
      originalItems.forEach(function (item) {
        var clone = item.cloneNode(true);
        clone.classList.add("trajetoria-item-clone");
        clone.classList.remove("reveal");
        clone.setAttribute("aria-hidden", "true");
        inner.appendChild(clone);
      });

      trajetoriaTrack.appendChild(inner);
      trajetoriaInner = inner;

      /* Mede a distância real (em px, via getBoundingClientRect — não
         offsetLeft, que dependeria do offsetParent) entre o início do
         conjunto original e o início do conjunto clonado, em vez de supor
         -50%. Isso elimina o erro de meio-gap que causava um salto
         perceptível no reinício do loop (ver @keyframes no CSS). */
      trajetoriaMeasureLoop();

      trajetoriaTrack.classList.add("is-marquee");
    }

    /* Mede/atualiza --trajetoria-loop-distance. Reutilizada no setup e no
       resize: a largura dos itens é em vw, então a distância muda com a
       viewport mesmo sem cruzar o breakpoint (ex.: rotação do tablet). */
    function trajetoriaMeasureLoop() {
      if (!trajetoriaInner) return;
      var firstOriginal = trajetoriaInner.querySelector(".trajetoria-item:not(.trajetoria-item-clone)");
      var firstClone = trajetoriaInner.querySelector(".trajetoria-item-clone");
      if (firstOriginal && firstClone) {
        var loopDistance = firstClone.getBoundingClientRect().left - firstOriginal.getBoundingClientRect().left;
        trajetoriaTrack.style.setProperty("--trajetoria-loop-distance", loopDistance + "px");
      }
    }

    var trajetoriaResizeTicking = false;
    window.addEventListener("resize", function () {
      if (!trajetoriaInner || trajetoriaResizeTicking) return;
      trajetoriaResizeTicking = true;
      window.requestAnimationFrame(function () {
        trajetoriaResizeTicking = false;
        trajetoriaMeasureLoop();
      });
    });

    function trajetoriaTeardownMarquee() {
      if (!trajetoriaInner) return;

      var originals = trajetoriaInner.querySelectorAll(".trajetoria-item:not(.trajetoria-item-clone)");
      originals.forEach(function (item) {
        trajetoriaTrack.appendChild(item);
      });
      trajetoriaInner.remove();
      trajetoriaTrack.style.removeProperty("--trajetoria-loop-distance");

      trajetoriaInner = null;
      trajetoriaTrack.classList.remove("is-marquee");
    }

    function trajetoriaHandleMediaChange() {
      if (trajetoriaMedia.matches) {
        trajetoriaSetupMarquee();
      } else {
        trajetoriaTeardownMarquee();
      }
    }

    if (typeof trajetoriaMedia.addEventListener === "function") {
      trajetoriaMedia.addEventListener("change", trajetoriaHandleMediaChange);
    }

    trajetoriaHandleMediaChange();
  }

  /* ---------------------------------------------------------
     Trilha de progresso da timeline (seção "Como Funciona")
     mobile/tablet. Isolado: só lê/escreve dentro de #timeline,
     não cria listeners globais fora deste escopo nem afeta
     outras seções. Mede a posição real dos marcadores (1º e
     último .timeline-step) via getBoundingClientRect e usa isso
     para posicionar a trilha base (.timeline-track) e preencher
     a camada de progresso (.timeline-progress, criada aqui) de
     acordo com o quanto da seção já passou pelo meio da tela.
  --------------------------------------------------------- */
  var timelineEl = document.getElementById("timeline");

  if (timelineEl) {
    var timelineTrack = timelineEl.querySelector(".timeline-track");
    var timelineSteps = timelineEl.querySelectorAll(".timeline-step");
    var timelineMedia = window.matchMedia("(max-width: 1279px)");
    var TIMELINE_MARKER_OFFSET = 15; // px — centro aproximado do círculo marcador (top: 0.4rem + metade do círculo)
    var timelineProgressEl = null;
    var timelineTicking = false;

    function timelineEnsureProgressEl() {
      if (!timelineTrack) return null;
      if (!timelineProgressEl) {
        timelineProgressEl = document.createElement("div");
        timelineProgressEl.className = "timeline-progress";
        timelineProgressEl.setAttribute("aria-hidden", "true");
        timelineTrack.appendChild(timelineProgressEl);
      }
      return timelineProgressEl;
    }

    function timelineRemoveProgressEl() {
      if (timelineProgressEl) {
        timelineProgressEl.remove();
        timelineProgressEl = null;
      }
    }

    /* Desktop (>=1280px): progressão HORIZONTAL — a linha (.timeline-track) vai
       preenchendo da esquerda para a direita conforme a timeline entra na
       tela; etapas já alcançadas ganham .is-active. Abaixo de 1280px segue o
       comportamento vertical de sempre (função abaixo, inalterada). */
    function timelineUpdateHorizontal() {
      var progressEl = timelineEnsureProgressEl();
      if (!progressEl) return;

      timelineTrack.style.removeProperty("--timeline-track-top");
      timelineTrack.style.removeProperty("--timeline-track-height");

      /* Desktop: a animação é um loop CSS contínuo (10s); aqui só limpamos
         qualquer estado inline/classe deixado pelo modo vertical. */
      progressEl.style.height = "";
      progressEl.style.width = "";
      timelineSteps.forEach(function (step) { step.classList.remove("is-active"); });
    }

    function timelineUpdate() {
      timelineTicking = false;
      if (!timelineTrack || timelineSteps.length < 2) return;
      if (!timelineMedia.matches) { timelineUpdateHorizontal(); return; }

      var containerRect = timelineEl.getBoundingClientRect();
      var firstRect = timelineSteps[0].getBoundingClientRect();
      var lastRect = timelineSteps[timelineSteps.length - 1].getBoundingClientRect();

      var trackTop = (firstRect.top - containerRect.top) + TIMELINE_MARKER_OFFSET;
      var trackBottom = (lastRect.top - containerRect.top) + TIMELINE_MARKER_OFFSET;
      var trackHeight = Math.max(0, trackBottom - trackTop);

      timelineTrack.style.setProperty("--timeline-track-top", trackTop + "px");
      timelineTrack.style.setProperty("--timeline-track-height", trackHeight + "px");

      var progressEl = timelineEnsureProgressEl();
      if (!progressEl) return;

      var viewportLine = window.innerHeight * 0.55;
      var trackViewportTop = firstRect.top + TIMELINE_MARKER_OFFSET;
      var trackViewportBottom = lastRect.top + TIMELINE_MARKER_OFFSET;
      var span = trackViewportBottom - trackViewportTop || 1;
      var ratio = Math.max(0, Math.min(1, (viewportLine - trackViewportTop) / span));

      progressEl.style.width = "";
      progressEl.style.height = (trackHeight * ratio) + "px";

      timelineSteps.forEach(function (step, i) {
        var stepRatio = i / (timelineSteps.length - 1);
        step.classList.toggle("is-active", ratio >= stepRatio - 0.02);
      });
    }

    function timelineOnScroll() {
      if (timelineTicking) return;
      timelineTicking = true;
      window.requestAnimationFrame(timelineUpdate);
    }

    function timelineHandleMediaChange() {
      timelineEnsureProgressEl();
      timelineUpdate();
    }

    window.addEventListener("scroll", timelineOnScroll, { passive: true });
    window.addEventListener("resize", timelineOnScroll);

    if (typeof timelineMedia.addEventListener === "function") {
      timelineMedia.addEventListener("change", timelineHandleMediaChange);
    }

    /* Desktop (>=1280px): o loop só roda com a seção visível (IntersectionObserver);
       fora da tela fica pausado. Com reduced-motion o CSS deixa tudo estático. */
    if ("IntersectionObserver" in window && !prefersReducedMotion) {
      var timelineObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          timelineEl.classList.toggle("is-playing", entry.isIntersecting);
        });
      }, { threshold: 0.15 });
      timelineObserver.observe(timelineEl);
    }

    timelineHandleMediaChange();
  }

  /* ---------------------------------------------------------
     Carrossel manual de #servicos (só mobile <768px)
     Scroll nativo (overflow + scroll-snap) — o JS apenas observa o
     scroll de #caminhos: acompanha a barra de progresso, marca o card
     ativo, apaga a dica "Arraste para ver mais" no primeiro swipe e
     some com o fade lateral no fim. Listener só no próprio carrossel.
  --------------------------------------------------------- */
  var caminhosEl = document.getElementById("caminhos");
  var caminhosWrap = document.getElementById("caminhos-wrap");

  if (caminhosEl && caminhosWrap) {
    var caminhoCards = caminhosEl.querySelectorAll(".caminho");
    var caminhosHint = document.getElementById("caminhos-hint");
    var caminhosBar = document.getElementById("caminhos-progress-bar");
    var caminhosMedia = window.matchMedia("(max-width: 1279px)");
    var caminhosTicking = false;
    var caminhosHintDismissed = false;

    function caminhosUpdate() {
      caminhosTicking = false;
      if (!caminhosMedia.matches) return;

      var max = caminhosEl.scrollWidth - caminhosEl.clientWidth;
      var ratio = max > 0 ? Math.max(0, Math.min(1, caminhosEl.scrollLeft / max)) : 0;
      var total = caminhoCards.length;

      if (caminhosBar && total > 0) {
        caminhosBar.style.width = (100 / total) + "%";
        caminhosBar.style.transform = "translateX(" + (ratio * (total - 1) * 100) + "%)";
      }

      var activeIndex = Math.round(ratio * (total - 1));
      caminhoCards.forEach(function (card, i) {
        card.classList.toggle("is-active", i === activeIndex);
      });

      caminhosWrap.classList.toggle("is-end", ratio > 0.95);

      if (!caminhosHintDismissed && caminhosEl.scrollLeft > 8) {
        caminhosHintDismissed = true;
        if (caminhosHint) caminhosHint.classList.add("is-hidden");
      }
    }

    function caminhosOnScroll() {
      if (caminhosTicking) return;
      caminhosTicking = true;
      window.requestAnimationFrame(caminhosUpdate);
    }

    caminhosEl.addEventListener("scroll", caminhosOnScroll, { passive: true });

    if (typeof caminhosMedia.addEventListener === "function") {
      caminhosMedia.addEventListener("change", caminhosUpdate);
    }

    caminhosUpdate();
  }

  /* ---------------------------------------------------------
     #construir — carrossel manual de 3 etapas (só mobile <768px)
     Scroll nativo + scroll-snap; o JS só lê o scroll de #construir-steps
     e atualiza contador "01 / 03", barra, dots e setas; setas/dots
     rolam até o slide certo. Sem autoplay, loop ou listeners globais.
  --------------------------------------------------------- */
  var construirSteps = document.getElementById("construir-steps");

  if (construirSteps) {
    var construirSlides = construirSteps.querySelectorAll(".construir-card");
    var construirNum = document.getElementById("construir-counter-num");
    var construirBar = document.getElementById("construir-progress-bar");
    var construirPrev = document.getElementById("construir-prev");
    var construirNext = document.getElementById("construir-next");
    var construirDots = document.querySelectorAll("#construir-dots .construir-dot");
    var construirMedia = window.matchMedia("(max-width: 1279px)");
    var construirTicking = false;

    function construirIndex() {
      var width = construirSteps.clientWidth || 1;
      var i = Math.round(construirSteps.scrollLeft / width);
      return Math.max(0, Math.min(construirSlides.length - 1, i));
    }

    function construirUpdate() {
      construirTicking = false;
      if (!construirMedia.matches) return;

      var total = construirSlides.length;
      var i = construirIndex();

      if (construirNum) construirNum.textContent = "0" + (i + 1);
      if (construirBar) construirBar.style.width = (((i + 1) / total) * 100) + "%";
      if (construirPrev) construirPrev.disabled = i === 0;
      if (construirNext) construirNext.disabled = i === total - 1;

      construirDots.forEach(function (dot, d) {
        var active = d === i;
        dot.classList.toggle("is-active", active);
        if (active) {
          dot.setAttribute("aria-current", "true");
        } else {
          dot.removeAttribute("aria-current");
        }
      });
    }

    function construirGo(target) {
      var total = construirSlides.length;
      var i = Math.max(0, Math.min(total - 1, target));
      construirSteps.scrollTo({
        left: i * construirSteps.clientWidth,
        behavior: prefersReducedMotion ? "auto" : "smooth"
      });
    }

    construirSteps.addEventListener("scroll", function () {
      if (construirTicking) return;
      construirTicking = true;
      window.requestAnimationFrame(construirUpdate);
    }, { passive: true });

    if (construirPrev) construirPrev.addEventListener("click", function () { construirGo(construirIndex() - 1); });
    if (construirNext) construirNext.addEventListener("click", function () { construirGo(construirIndex() + 1); });

    construirDots.forEach(function (dot) {
      dot.addEventListener("click", function () {
        construirGo(parseInt(dot.getAttribute("data-step"), 10));
      });
    });

    if (typeof construirMedia.addEventListener === "function") {
      construirMedia.addEventListener("change", construirUpdate);
    }
    window.addEventListener("resize", function () {
      if (!construirTicking) {
        construirTicking = true;
        window.requestAnimationFrame(construirUpdate);
      }
    });

    construirUpdate();
  }

  /* ---------------------------------------------------------
     #para-quem — accordion (só mobile <768px; fora dele os botões
     ficam ocultos). Um item aberto por vez; pode ficar tudo fechado.
     Isolado nesta seção: listeners só nos botões do accordion.
  --------------------------------------------------------- */
  var paraQuemItems = document.querySelectorAll("#para-quem-list .para-quem-item");

  if (paraQuemItems.length) {
    function paraQuemSet(item, open) {
      var toggle = item.querySelector(".para-quem-toggle");
      item.classList.toggle("is-open", open);
      if (toggle) toggle.setAttribute("aria-expanded", open ? "true" : "false");
    }

    paraQuemItems.forEach(function (item) {
      var toggle = item.querySelector(".para-quem-toggle");
      if (!toggle) return;

      toggle.addEventListener("click", function () {
        var willOpen = !item.classList.contains("is-open");
        paraQuemItems.forEach(function (other) {
          if (other !== item) paraQuemSet(other, false);
        });
        paraQuemSet(item, willOpen);
      });
    });

    /* Desktop (>=1280px): a foto de fundo usa a altura da seção com todos os
       itens FECHADOS (--pq-h), medida só no load/resize — nunca ao abrir ou
       fechar um item — para não mudar de escala com o accordion. */
    var paraQuemSection = document.getElementById("para-quem");
    var paraQuemDesktop = window.matchMedia("(min-width: 1280px)");
    var paraQuemTimer = null;

    function paraQuemMeasure() {
      if (!paraQuemSection) return;
      if (!paraQuemDesktop.matches) {
        paraQuemSection.style.removeProperty("--pq-h");
        return;
      }
      var closed = paraQuemSection.offsetHeight;
      paraQuemSection.querySelectorAll(".para-quem-item.is-open .para-quem-panel").forEach(function (panel) {
        closed -= panel.offsetHeight;
      });
      paraQuemSection.style.setProperty("--pq-h", Math.round(closed) + "px");
    }

    paraQuemMeasure();
    window.addEventListener("load", paraQuemMeasure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(paraQuemMeasure);
    window.addEventListener("resize", function () {
      window.clearTimeout(paraQuemTimer);
      paraQuemTimer = window.setTimeout(paraQuemMeasure, 120);
    });
  }

  /* ---------------------------------------------------------
     Botão flutuante do WhatsApp: contato direto, sem passar pela
     experiência de seleção/formulário.
  --------------------------------------------------------- */
  document.querySelectorAll("[data-whatsapp='flutuante']").forEach(function (link) {
    link.setAttribute("href", WHATSAPP_FLUTUANTE);
    link.setAttribute("target", "_blank");
    link.setAttribute("rel", "noopener noreferrer");
  });

  /* ---------------------------------------------------------
     EXPERIÊNCIA DE CONTATO — overlay com 2 etapas
     01/02: escolha de modalidade (consultoria | presencial)
     02/02: formulário curto → abre o WhatsApp do Henrique com a
     mensagem pronta. Nada é salvo (sem storage/servidor/analytics);
     os dados só montam a mensagem. CTAs usam [data-jde-contact] e
     data-modalidade="consultoria" | "presencial" | "" (genérico).
  --------------------------------------------------------- */
  var jdeModal = document.getElementById("jde-modal");

  if (jdeModal) {
    var JDE_MODES = {
      consultoria: {
        resumo: "CONSULTORIA COM HENRIQUE",
        continuar: "Continuar com consultoria →",
        nome: "Consultoria",
        intro: "Olá, Henrique! Vim pelo site da Jogador de Elite e quero saber mais sobre a Consultoria."
      },
      presencial: {
        resumo: "TREINO PRESENCIAL COM HENRIQUE",
        continuar: "Continuar com presencial →",
        nome: "Presencial",
        intro: "Olá, Henrique! Vim pelo site da Jogador de Elite e quero saber mais sobre o treinamento presencial."
      }
    };

    var jdeSelectedMode = null;
    var jdeCurrentStep = 1;
    var jdeLastTrigger = null;
    var jdeScrollY = 0;

    var jdePanel = document.getElementById("jde-panel");
    var jdeStep1 = document.getElementById("jde-step-1");
    var jdeStep2 = document.getElementById("jde-step-2");
    var jdeStepLabel = document.getElementById("jde-step-label");
    var jdeStepBar = document.getElementById("jde-step-bar");
    var jdeModesWrap = document.getElementById("jde-modes");
    var jdeModeBtns = jdeModal.querySelectorAll(".jde-mode");
    var jdeContinueWrap = document.getElementById("jde-continue-wrap");
    var jdeContinueBtn = document.getElementById("jde-continue");
    var jdeSummaryName = document.getElementById("jde-summary-name");
    var jdeForm = document.getElementById("jde-form");

    function jdeSelectMode(mode) {
      jdeSelectedMode = JDE_MODES[mode] ? mode : null;

      jdeModeBtns.forEach(function (btn) {
        var on = btn.getAttribute("data-mode") === jdeSelectedMode;
        btn.classList.toggle("is-selected", on);
        btn.setAttribute("aria-pressed", on ? "true" : "false");
      });
      jdeModesWrap.classList.toggle("has-selection", !!jdeSelectedMode);
      jdeContinueWrap.classList.toggle("is-visible", !!jdeSelectedMode);

      if (jdeSelectedMode) {
        jdeContinueBtn.textContent = JDE_MODES[jdeSelectedMode].continuar;
        jdeSummaryName.textContent = JDE_MODES[jdeSelectedMode].resumo;
      }
    }

    function jdeShowStep(step) {
      jdeCurrentStep = step;
      jdeStep1.classList.toggle("is-active", step === 1);
      jdeStep2.classList.toggle("is-active", step === 2);
      jdeStepLabel.textContent = step === 1 ? "01 / 02" : "02 / 02";
      jdeStepBar.style.width = step === 1 ? "50%" : "100%";
      jdeModal.setAttribute("aria-labelledby", step === 1 ? "jde-title-1" : "jde-title-2");
      jdePanel.scrollTop = 0;
    }

    function jdeGoToForm() {
      if (!jdeSelectedMode) return;
      jdeShowStep(2);
      document.getElementById("jde-title-2").focus({ preventScroll: true });
    }

    function jdeGoBackToSelection() {
      jdeShowStep(1);
      var sel = jdeModal.querySelector(".jde-mode.is-selected") || jdeModeBtns[0];
      if (sel) sel.focus({ preventScroll: true });
    }

    /* Trava o scroll do body preservando a posição (sem pulo ao fechar). */
    function jdeLockScroll() {
      jdeScrollY = window.pageYOffset || document.documentElement.scrollTop || 0;
      var sbw = window.innerWidth - document.documentElement.clientWidth;
      document.body.style.position = "fixed";
      document.body.style.top = "-" + jdeScrollY + "px";
      document.body.style.left = "0";
      document.body.style.right = "0";
      document.body.style.width = "100%";
      if (sbw > 0) document.body.style.paddingRight = sbw + "px";
    }

    function jdeUnlockScroll() {
      var root = document.documentElement;
      var prevBehavior = root.style.scrollBehavior;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.left = "";
      document.body.style.right = "";
      document.body.style.width = "";
      document.body.style.paddingRight = "";
      root.style.scrollBehavior = "auto";
      window.scrollTo(0, jdeScrollY);
      root.style.scrollBehavior = prevBehavior;
    }

    function jdeSetBackgroundInert(on) {
      Array.prototype.forEach.call(document.body.children, function (el) {
        if (el === jdeModal || el.tagName === "SCRIPT") return;
        if (on) { el.setAttribute("inert", ""); } else { el.removeAttribute("inert"); }
      });
    }

    function openContactExperience(mode, trigger) {
      jdeLastTrigger = trigger || document.activeElement;
      jdeLockScroll();
      jdeSetBackgroundInert(true);
      jdeSelectMode(mode);
      jdeShowStep(1);
      jdeModal.classList.add("is-open");
      jdeModal.setAttribute("aria-hidden", "false");
      jdePanel.focus({ preventScroll: true });
    }

    function closeContactExperience() {
      if (!jdeModal.classList.contains("is-open")) return;
      jdeModal.classList.remove("is-open");
      jdeModal.setAttribute("aria-hidden", "true");
      jdeSetBackgroundInert(false);
      jdeUnlockScroll();
      if (jdeLastTrigger && typeof jdeLastTrigger.focus === "function") {
        jdeLastTrigger.focus({ preventScroll: true });
      }
    }

    /* --- Validação (mensagens junto ao campo, sem alert) --- */
    var JDE_FIELDS = [
      { id: "jde-nome", err: "jde-err-nome", msg: "Informe seu nome." },
      { id: "jde-idade", err: "jde-err-idade", msg: "Informe sua idade." },
      { id: "jde-cidade", err: "jde-err-cidade", msg: "Informe sua cidade/estado." },
      { id: "jde-situacao", err: "jde-err-situacao", msg: "Escolha sua situação atual." },
      { id: "jde-objetivo", err: "jde-err-objetivo", msg: "Conte brevemente seu objetivo." }
    ];

    function jdeSetError(field, message) {
      var input = document.getElementById(field.id);
      var errEl = document.getElementById(field.err);
      errEl.textContent = message || "";
      input.parentNode.classList.toggle("has-error", !!message);
      if (message) {
        input.setAttribute("aria-invalid", "true");
      } else {
        input.removeAttribute("aria-invalid");
      }
    }

    function jdeFieldMessage(field) {
      var value = document.getElementById(field.id).value.trim();
      if (!value) return field.msg;
      if (field.id === "jde-idade") {
        var age = parseInt(value, 10);
        if (isNaN(age) || age < 8 || age > 60) return "Informe uma idade válida (de 8 a 60 anos).";
      }
      return "";
    }

    function validateForm() {
      var firstInvalid = null;
      JDE_FIELDS.forEach(function (field) {
        var message = jdeFieldMessage(field);
        jdeSetError(field, message);
        if (message && !firstInvalid) firstInvalid = document.getElementById(field.id);
      });
      if (firstInvalid) firstInvalid.focus();
      return !firstInvalid;
    }

    function buildWhatsAppMessage() {
      var cfg = JDE_MODES[jdeSelectedMode];
      var val = function (id) { return document.getElementById(id).value.trim(); };
      return cfg.intro + "\n\n" +
        "Nome: " + val("jde-nome") + "\n" +
        "Idade: " + val("jde-idade") + " anos\n" +
        "Cidade/Estado: " + val("jde-cidade") + "\n" +
        "Situação atual: " + val("jde-situacao") + "\n" +
        "Modalidade: " + cfg.nome + "\n" +
        "Objetivo: " + val("jde-objetivo");
    }

    function openWhatsApp(message) {
      var url = "https://wa.me/" + WHATSAPP_NUMERO + "?text=" + encodeURIComponent(message);
      var a = document.createElement("a");
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }

    /* --- Eventos --- */
    document.addEventListener("click", function (e) {
      var trigger = e.target.closest ? e.target.closest("[data-jde-contact]") : null;
      if (!trigger) return;
      e.preventDefault();
      var mobileNavEl = document.getElementById("mobile-nav");
      if (mobileNavEl && mobileNavEl.classList.contains("open")) closeMobileNav();
      openContactExperience(trigger.getAttribute("data-modalidade") || "", trigger);
    });

    jdeModeBtns.forEach(function (btn) {
      btn.addEventListener("click", function () { jdeSelectMode(btn.getAttribute("data-mode")); });
    });
    jdeContinueBtn.addEventListener("click", jdeGoToForm);
    document.getElementById("jde-change").addEventListener("click", jdeGoBackToSelection);
    document.getElementById("jde-close").addEventListener("click", closeContactExperience);

    JDE_FIELDS.forEach(function (field) {
      var input = document.getElementById(field.id);
      var clear = function () { if (input.parentNode.classList.contains("has-error") && !jdeFieldMessage(field)) jdeSetError(field, ""); };
      input.addEventListener("input", clear);
      input.addEventListener("change", clear);
    });

    jdeForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!jdeSelectedMode || !validateForm()) return;
      openWhatsApp(buildWhatsAppMessage());
    });

    /* ESC fecha; Tab fica preso dentro do overlay. */
    document.addEventListener("keydown", function (e) {
      if (!jdeModal.classList.contains("is-open")) return;

      if (e.key === "Escape") {
        e.preventDefault();
        closeContactExperience();
        return;
      }

      if (e.key === "Tab") {
        var focusables = jdeModal.querySelectorAll("button, input, select, textarea, a[href]");
        var visible = Array.prototype.filter.call(focusables, function (el) {
          return !el.disabled && el.offsetParent !== null && el.closest(".jde-continue:not(.is-visible)") === null;
        });
        if (!visible.length) { e.preventDefault(); return; }
        var first = visible[0];
        var last = visible[visible.length - 1];
        var active = document.activeElement;
        if (e.shiftKey && (active === first || active === jdePanel)) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }
})();
