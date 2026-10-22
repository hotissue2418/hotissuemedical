$(function() {
    introVideoScrollZoom();
    introVideoLoop();
    aniSlideScrollActive();
    visualTitleReveal();
    aboutTitleScrollFill();
    accordionAction();
    gnbDepthAction();
    moMenuAction();
    partnerHoverAction();
    flowScrollDirection();
    quickMenuGoToTop();
    quickMenuToggle();
    quickMenuStopAtFooter();
});

/* sect-intro 배경 비디오: 섹션이 보이기 시작하면 스크롤에 따라 1배 → 2배로 확대 */
function introVideoScrollZoom(){
    const $sect = $(".sect-intro"),
        $video = $sect.find(".intro-video"),
        maxScale = 2;

    if(!$video.length) return;

    function zoomUpdate(){
        const winTop = $(window).scrollTop(),
            winH = $(window).height(),
            sectTop = $sect.offset().top,
            progress = Math.min(Math.max((winTop + winH - sectTop) / (winH + $sect.outerHeight()), 0), 1);

        $video.css("transform", "scale(" + (1 + (maxScale - 1) * progress) + ")");
    }

    $(window).on("scroll resize", zoomUpdate);
    zoomUpdate();
}

/* sect-intro 배경 비디오: 무한 반복 (loop 속성이 동작하지 않는 환경에서 마지막 프레임에 멈추면 처음부터 다시 재생) */
function introVideoLoop(){
    const video = $(".sect-intro .intro-video")[0];

    if(!video) return;

    video.loop = true;

    function replay(){
        video.currentTime = 0;
        const playing = video.play();

        if(playing) playing.catch(function(){});
    }

    $(video).on("ended", replay);
    $(video).on("pause", function(){
        if(video.duration && video.currentTime >= video.duration - 0.1) replay();
    });
}

/* 화면에 보일 때 .ani-slide-top(아래→위), .ani-slide-left(왼쪽→오른쪽) 요소에 .on을 붙임
   요소가 화면 아래로 완전히 벗어나면(스크롤을 위로 올리면) .on을 떼서 처음 상태로 되돌림
   .ani-group 안의 요소는 그룹이 보일 때 한꺼번에 시작 */
function aniSlideScrollActive(){
    const aniSel = ".ani-slide-top, .ani-slide-left, .ani-up",
        $groups = $(".ani-group"),
        $targets = $(aniSel).not($groups.find(aniSel));

    if(!$targets.length && !$groups.length) return;

    /* .ani-up 은 .on 이 열림 상태로 쓰이는 요소(아코디언)용이라 .show 를 사용 */
    function aniClass($el){
        return $el.hasClass("ani-up") ? "show" : "on";
    }

    function aniShow($el){
        $el.addClass(aniClass($el));
    }

    function aniHide($el){
        $el.removeClass(aniClass($el));
    }

    function aniEach($el, fn){
        if($el.hasClass("ani-group")){
            $el.find(aniSel).each(function(){
                fn($(this));
            });
        }else{
            fn($el);
        }
    }

    if(!("IntersectionObserver" in window)){
        $(aniSel).each(function(){
            aniShow($(this));
        });
        return;
    }

    const showObserver = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
            if(entry.isIntersecting) aniEach($(entry.target), aniShow);
        });
    }, {threshold:0.15});

    /* 화면 아래로 완전히 벗어난 요소만 초기화 (이미 지나쳐 올라간 요소는 유지) */
    const hideObserver = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
            if(!entry.isIntersecting && entry.boundingClientRect.top > 0) aniEach($(entry.target), aniHide);
        });
    }, {threshold:0});

    $targets.add($groups).each(function(){
        showObserver.observe(this);
        hideObserver.observe(this);
    });
}

/* sect-visual 타이틀: 진입 시 blur/투명 상태에서 선명한 검정으로 전환, 섹션을 벗어나면 처음 상태로 되돌림 */
function visualTitleReveal(){
    const $sect = $(".sect-visual"),
        $tit = $(".visual-tit");

    if(!$tit.length) return;

    if(!("IntersectionObserver" in window)){
        $tit.addClass("on");
        return;
    }

    let timer;

    new IntersectionObserver(function(entries){
        clearTimeout(timer);

        if(entries[0].isIntersecting){
            timer = setTimeout(function(){
                $tit.addClass("on");
            }, 100);
        }else{
            $tit.removeClass("on");
        }
    }, {threshold:0}).observe($sect[0]);
}

/* sect-about 영문 타이틀: 스크롤에 따라 회색 글자 위로 흰색이 차오름 */
function aboutTitleScrollFill(){
    const $sect = $(".sect-about");

    if(!$sect.find(".eng-line").length) return;

    /* PC/MO 타이틀 마크업이 따로 있으므로 보이는 쪽만 사용 (MO: 7조각, 시작 위치 264, 구간 400) */
    function fillUpdate(){
        const $lines = $sect.find(".about-tit:visible .eng-line"),
            isMo = window.matchMedia("(max-width:1279px)").matches,
            sectTop = $sect.offset().top,
            winH = $(window).height(),
            progress = Math.min(Math.max(($(window).scrollTop() + winH * 0.8 - sectTop - (isMo ? 264 : 315)) / (isMo ? 400 : 700), 0), 1);

        $lines.each(function(idx){
            const rate = Math.min(Math.max(progress * $lines.length - idx, 0), 1);
            $(this).find(".fill").css("width", (rate * 100) + "%");
        });
    }

    $(window).on("scroll resize", fillUpdate);
    fillUpdate();
}

/* sect-why 아코디언: 항목마다 따로 열고 닫음 (다른 항목은 그대로 유지) */
function accordionAction(){
    $(".accordion-item .accordion-btn").on("click", function(){
        const $item = $(this).closest(".accordion-item"),
            isOpen = !$item.hasClass("on");

        $item.toggleClass("on", isOpen);
        $(this).attr("aria-expanded", isOpen);
    });
}

/* partner-area, marquee-area: 스크롤을 올릴 때는 흐르는 방향을 반대로 바꿈
   음수 playbackRate는 시작점(0)에 닿으면 애니메이션이 끝나 멈추므로, 애니메이션을 일시정지하고 currentTime을 직접 앞/뒤로 이동시킴 (반복 구간 안에서 순환) */
function flowScrollDirection(){
    const $flows = $(".partner-area .partner-list, .marquee-area .marquee-track");

    if(!$flows.length || !$flows[0].getAnimations) return;

    let lastTop = $(window).scrollTop(),
        lastTime = null,
        direction = 1;

    $(window).on("scroll", function(){
        const winTop = $(window).scrollTop();

        if(winTop === lastTop) return;

        direction = winTop > lastTop ? 1 : -1;
        lastTop = winTop;
    });

    function flowUpdate(time){
        const delta = lastTime === null ? 0 : Math.min(time - lastTime, 100);
        lastTime = time;

        $flows.each(function(){
            this.getAnimations().forEach(function(ani){
                const duration = ani.effect.getTiming().duration;

                if(ani.playState === "running") ani.pause();

                ani.currentTime = ((ani.currentTime + delta * direction) % duration + duration) % duration;
            });
        });

        requestAnimationFrame(flowUpdate);
    }

    requestAnimationFrame(flowUpdate);
}

/* quick menu: 맨 위로 */
function quickMenuGoToTop(){
    $(".btn-quick-top").on("click", function(){
        if(lenis){
            lenis.scrollTo(0, {duration:0.8});
        } else {
            $("html, body").stop().animate({scrollTop:0}, 500);
        }
    });
}

/* quick menu(1279px 이하): + 버튼으로 전화/카카오 항목을 위로 펼치고 닫음 */
function quickMenuToggle(){
    const $menu = $(".quick-menu"),
        $btn = $menu.find(".btn-quick-toggle");

    $btn.on("click", function(){
        const isOpen = !$menu.hasClass("on");

        $menu.toggleClass("on", isOpen);
        $btn.attr({"aria-expanded":isOpen, "aria-label":isOpen ? "빠른 문의 닫기" : "빠른 문의 열기"});
    });
}

/* quick menu: 푸터가 보이기 시작하면 푸터 위에서 멈춤 (푸터가 올라온 만큼 같이 밀려 올라감) */
function quickMenuStopAtFooter(){
    const $wrap = $(".wrapper"),
        $footer = $(".footer");

    if(!$footer.length) return;

    function liftUpdate(){
        const lift = Math.max($(window).height() - $footer[0].getBoundingClientRect().top, 0);

        $wrap.css("--quick-lift", lift + "px");
    }

    $(window).on("scroll resize", liftUpdate);
    liftUpdate();
}

/* partner-area: 로고마다 img_partnerNN_on.png 를 겹쳐 두고, 마우스 오버하면 CSS 트랜지션으로 교체 */
function partnerHoverAction(){
    const $items = $(".partner-area .partner-item");

    if(!$items.length) return;

    $items.each(function(){
        const $img = $(this).find("img");

        $("<img>", {
            "class":"img-on",
            src:$img.attr("src").replace(/\.png$/, "_on.png"),
            alt:""
        }).appendTo(this);
    });
}

/* gnb-depth: 헤더(mix-blend-mode) 밖의 .gnb-depth-area 에 있으므로, 메뉴 위치에 맞춰 직접 열고 닫음 */
function gnbDepthAction(){
    const $items = $(".gnb-menu-item[data-depth]"),
        $depths = $(".gnb-depth");
    let closeTimer;

    if(!$items.length || !$depths.length) return;

    function depthOpen(key){
        const $item = $items.filter("[data-depth='" + key + "']"),
            $depth = $depths.filter("[data-depth='" + key + "']"),
            rect = $item[0].getBoundingClientRect();

        clearTimeout(closeTimer);
        depthClose($depth);
        $depth.css({top:rect.bottom, left:rect.left + rect.width / 2}).addClass("on");
        $item.addClass("on");
    }

    function depthClose($except){
        const $targets = $except ? $depths.not($except) : $depths;

        $targets.removeClass("on");
        $items.not($except ? $items.filter("[data-depth='" + $except.data("depth") + "']") : $()).removeClass("on");
    }

    $items.add($depths).on("mouseenter focusin", function(){
        depthOpen($(this).data("depth"));
    }).on("mouseleave", function(){
        closeTimer = setTimeout(function(){
            depthClose();
        }, 100);
    });

    $items.on("focusout", function(){
        closeTimer = setTimeout(function(){
            if(!$(document.activeElement).closest($items).length) depthClose();
        }, 100);
    });

    $(".gnb-menu-item").not($items).on("mouseenter", function(){
        depthClose();
    });
}

/* 모바일 메뉴(1279px 이하): 햄버거로 전체 메뉴를 열고 닫으며, 열려 있는 동안 스크롤을 잠금. 대메뉴는 아코디언으로 하나씩 펼침 */
function moMenuAction(){
    const $btn = $(".btn-menu"),
        $menu = $(".mo-menu"),
        $acc = $menu.find(".mo-menu-item:has(.mo-menu-btn)");

    if(!$btn.length || !$menu.length) return;

    function menuToggle(isOpen){
        $btn.toggleClass("on", isOpen).attr({"aria-expanded":isOpen, "aria-label":isOpen ? "메뉴 닫기" : "메뉴 열기"});
        $menu.toggleClass("on", isOpen);
        if(lenis) isOpen ? lenis.stop() : lenis.start();
        if(!isOpen){
            $acc.removeClass("on").find(".mo-menu-btn").attr("aria-expanded", false);
        }
    }

    $btn.on("click", function(){
        menuToggle(!$btn.hasClass("on"));
    });

    $acc.find(".mo-menu-btn").on("click", function(){
        const $item = $(this).closest(".mo-menu-item"),
            isOpen = !$item.hasClass("on");

        $acc.not($item).removeClass("on").find(".mo-menu-btn").attr("aria-expanded", false);
        $item.toggleClass("on", isOpen);
        $(this).attr("aria-expanded", isOpen);
    });

    $(window).on("resize", function(){
        if(window.innerWidth > 1279 && $btn.hasClass("on")) menuToggle(false);
    });
}
