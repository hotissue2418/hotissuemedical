$(function() {
    revealTextAction();
    compareSliderAction();
    visualRippleAction();
    visualStickyTop();
    detailImgAction();
    companyTeamAction();
    strengthWaveAction();
    strengthTouchAction();
    growthDotAction();
});

/* .strength-icon-03: 03번 카드에 마우스를 올린 동안 선의 가장 높은 지점(마루)이 오른쪽 → 왼쪽으로 이동 (마우스 환경 PC 1280px 이상, 1279px 이하는 strengthTouchAction 의 strengthOn·strengthOff)
   원래 곡선의 오르막(riseStart~riseEnd)과 같은 폭·높이의 cos 물결을 왼쪽으로 밀며 그림 → 고점·저점에서 hold 만큼 짧게 이어진 뒤 꺾임
   mix(0 원래 모양 ~ 1 물결)로 두 모양을 섞어 부드럽게 시작하고, 마우스를 떼면 원래 d 로 복원
   - 조정값: duration(물결 한 개가 지나가는 시간, 초), mixSpeed(원래 모양 ↔ 물결 전환 빠르기), hold(고점·저점의 평평한 길이, 0 이면 바로 꺾임) */
function strengthWaveAction(){
    const $icon = $(".strength-icon-03"),
        $item = $icon.closest(".strength-item"),
        mq = window.matchMedia("(min-width:1280px) and (hover:hover)"),
        mqReduce = window.matchMedia("(prefers-reduced-motion:reduce)"),
        duration = 1.5,
        mixSpeed = 5,
        hold = 3,
        riseStart = 18.2468,
        riseEnd = 63.6085,
        count = 100;

    if(!$icon.length) return;

    /* 선마다 가로로 같은 간격(count 등분)의 높이(y) 목록을 만듦 */
    const lines = $icon.find(".line").map(function(i, el){
        const len = el.getTotalLength(),
            start = el.getPointAtLength(0).x,
            width = el.getPointAtLength(len).x - start,
            heights = [];
        let pos = 0;

        for(let j = 0; j <= count; j++){
            while(pos < len && el.getPointAtLength(pos).x < start + width * j / count) pos += 0.2;
            heights.push(el.getPointAtLength(pos).y);
        }

        return {el:el, d:el.getAttribute("d"), start:start, width:width, heights:heights};
    }).get();

    /* 가로 위치 x 의 물결 높이: progress 0 일 때 riseStart 가 저점(heights 처음 값), riseEnd 가 고점(heights 마지막 값) */
    function waveHeight(heights, x){
        const low = heights[0],
            high = heights[count],
            rise = riseEnd - riseStart,
            half = rise + hold,
            period = half * 2,
            pos = ((x - riseStart + progress * period) % period + period) % period,
            isFall = pos >= half,
            rate = Math.min((isFall ? pos - half : pos) / rise, 1),
            ease = (1 - Math.cos(rate * Math.PI)) / 2;

        return isFall ? high + (low - high) * ease : low + (high - low) * ease;
    }

    let hover = false, mix = 0, progress = 0, lastTime = null, rafId = null;

    function waveUpdate(now){
        const delta = lastTime === null ? 0 : Math.min((now - lastTime) / 1000, 0.1);

        lastTime = now;
        progress = (progress + delta / duration) % 1;
        mix += ((hover ? 1 : 0) - mix) * Math.min(delta * mixSpeed, 1);

        if(!hover && mix < 0.005){
            lines.forEach(function(line){
                line.el.setAttribute("d", line.d);
            });
            mix = 0;
            progress = 0;
            lastTime = null;
            rafId = null;
            return;
        }

        lines.forEach(function(line){
            let d = "";

            for(let j = 0; j <= count; j++){
                const x = line.start + line.width * j / count,
                    y = line.heights[j] + (waveHeight(line.heights, x) - line.heights[j]) * mix;

                d += (j ? "L" : "M") + x.toFixed(2) + " " + y.toFixed(2);
            }

            line.el.setAttribute("d", d);
        });

        rafId = requestAnimationFrame(waveUpdate);
    }

    $item.on("mouseenter strengthOn", function(e){
        if((e.type === "mouseenter" && !mq.matches) || mqReduce.matches) return;

        hover = true;
        if(!rafId) rafId = requestAnimationFrame(waveUpdate);
    }).on("mouseleave strengthOff", function(){
        hover = false;
    });
}

/* .detail-item, .team-area, .growth-list, .synergy-area: 화면 아래에서 1/3 지점에 닿으면 .active → .detail-item 은 1279px 이하에서 이미지 영역 0 → 150x110, .team-area·.growth-list·.synergy-area 는 아래에서 올라옴 (sub.css)
   rootMargin 하단 -33.333% → 화면 아래 1/3 을 제외한 영역과 겹칠 때 감지, 다시 그 아래로 내려가면 처음 상태로 되돌림 */
function detailImgAction(){
    const $items = $(".detail-item, .team-area, .growth-list, .synergy-area");

    if(!$items.length) return;

    if(!("IntersectionObserver" in window)){
        $items.addClass("active");
        return;
    }

    const observer = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
            if(entry.isIntersecting){
                $(entry.target).addClass("active");
            }else if(entry.boundingClientRect.top > entry.rootBounds.bottom){
                $(entry.target).removeClass("active");
            }
        });
    }, {rootMargin:"0px 0px -33.333% 0px"});

    $items.each(function(){
        observer.observe(this);
    });
}

/* sect-studio-visual sticky 기준점: 섹션이 화면보다 높으면 top 을 (화면높이 - 섹션높이)로 올려
   섹션 바닥까지 스크롤된 뒤 고정 → 다음 섹션이 그 위로 덮으며 올라옴 */
function visualStickyTop(){
    const $sect = $(".sect-studio-visual, .sect-company-visual");

    if(!$sect.length) return;

    function topUpdate(){
        $sect[0].style.setProperty("--visual-top", Math.min(0, window.innerHeight - $sect.outerHeight()) + "px");
    }

    $(window).on("resize load", topUpdate);
    topUpdate();
}

/* sect-studio-visual 이미지: jquery.ripples 물결 효과
   - 플러그인 기본 마우스 처리는 이동/클릭 세기가 0.01/0.14로 고정돼 있어 interactive:false 로 끄고,
     같은 방식(pageX/Y - offset)으로 직접 drop 을 호출해 세기를 조정
   - 조정값: perturbance(굴절 강도), dropRadius(물방울 크기), moveStrength(이동 시 세기), clickStrength(클릭 시 세기), resolution(물결 해상도)
   - WebGL 미지원 브라우저에서는 플러그인이 에러를 내므로 try/catch 로 건너뛰고 배경 이미지만 표시 */
function visualRippleAction(){
    const $imgs = $(".sect-studio-visual .ripple-img"),
        dropRadius = 20,
        moveStrength = 0.005,
        clickStrength = 0.2;

    if(!$imgs.length || !$.fn.ripples) return;

    try {
        $imgs.ripples({
            resolution:256,
            perturbance:0.025,
            dropRadius:dropRadius,
            interactive:false
        });
    } catch(e) {
        return;
    }

    function dropAt($el, pointer, radius, strength){
        const offset = $el.offset();

        $el.ripples("drop", pointer.pageX - offset.left, pointer.pageY - offset.top, radius, strength);
    }

    $imgs.on("mousemove", function(e){
        dropAt($(this), e, dropRadius, moveStrength);
    }).on("mousedown", function(e){
        dropAt($(this), e, dropRadius * 1.5, clickStrength);
    }).on("touchmove touchstart", function(e){
        const $el = $(this),
            touches = e.originalEvent.changedTouches;

        for(let i = 0; i < touches.length; i++){
            dropAt($el, touches[i], dropRadius, moveStrength);
        }
    });
}

/* .reveal-area: 화면에 보이면 .on → 마스크 안 텍스트가 아래에서 올라옴, 화면 아래로 벗어나면 처음 상태로 되돌림 */
function revealTextAction(){
    const $areas = $(".reveal-area");

    if(!$areas.length) return;

    if(!("IntersectionObserver" in window)){
        $areas.addClass("on");
        return;
    }

    const observer = new IntersectionObserver(function(entries){
        entries.forEach(function(entry){
            if(entry.isIntersecting){
                $(entry.target).addClass("on");
            }else if(entry.boundingClientRect.top > 0){
                $(entry.target).removeClass("on");
            }
        });
    }, {threshold:0.2});

    $areas.each(function(){
        observer.observe(this);
    });
}

/* .compare-slider: 드래그(마우스·터치) 또는 키보드 좌우 방향키로 보정 전/후 경계(--pos)를 이동 */
function compareSliderAction(){
    $(".compare-slider").each(function(){
        const $slider = $(this),
            $bar = $slider.find(".compare-bar");
        let dragging = false;

        function posSet(rate){
            const pos = Math.min(Math.max(rate, 0), 100);

            $slider[0].style.setProperty("--pos", pos + "%");
            $bar.attr("aria-valuenow", Math.round(pos));
        }

        function posFromEvent(e){
            const rect = $slider[0].getBoundingClientRect();

            posSet((e.clientX - rect.left) / rect.width * 100);
        }

        $slider.on("pointerdown", function(e){
            dragging = true;
            this.setPointerCapture(e.originalEvent.pointerId);
            posFromEvent(e.originalEvent);
        }).on("pointermove", function(e){
            if(dragging) posFromEvent(e.originalEvent);
        }).on("pointerup pointercancel", function(){
            dragging = false;
        });

        $bar.on("keydown", function(e){
            const now = Number($bar.attr("aria-valuenow"));

            if(e.key === "ArrowLeft" || e.key === "ArrowRight"){
                e.preventDefault();
                posSet(now + (e.key === "ArrowLeft" ? -5 : 5));
            }
        });
    });
}

/* sect-company-team: 팀 슬라이드(Swiper 4.0.7) ↔ 하단 탭 연동
   - 섹션이 상단에 걸리면 고정(sub.css sticky) → 휠·스와이프 한 번에 팀 1개씩 가로로 이동, 마지막 팀까지 이동하면 고정 해제
   - 1279px 이하: 활성 탭이 보이도록 탭 목록을 가로로 이동, 팀 영역이 화면 높이에 다 들어오지 않으면(가로 모드 휴대폰 등) 고정 없이 탭 클릭·스와이프로 전환
   - 조정값: scrollRate(팀 1개에 해당하는 스크롤 길이, 화면 높이 대비 비율), stepDelay(다음 팀을 넘길 수 있을 때까지의 시간, ms) */
function companyTeamAction(){
    const $sect = $(".sect-company-team"),
        $inner = $sect.find("> .inner"),
        $team = $sect.find(".team-area"),
        $slider = $(".team-slider"),
        $list = $(".team-tab-list"),
        $btns = $list.find(".team-tab-btn"),
        mq = window.matchMedia("(min-width:1280px)"),
        mqMo = window.matchMedia("(max-width:767px)"),
        $screen = $('<div aria-hidden="true" style="position:fixed; top:0; left:0; width:0; height:100svh; visibility:hidden; pointer-events:none;"></div>'),
        scrollRate = 0.8,
        stepDelay = 450,
        last = $btns.length - 1;
    let pinned = false, pinTop = 0, distance = 0, tabIdx = 0, prevTop = $(window).scrollTop(), lockTime = 0, wheelTime = 0, wheelDelta = 0, exitDir = 0, moveLimit = 0, isTouch = false, touch = null;

    if(!$slider.length || typeof Swiper === "undefined") return;

    function tabUpdate(idx){
        if(idx === tabIdx) return;

        tabIdx = idx;
        $list[0].style.setProperty("--tab-idx", idx);
        $btns.removeClass("on").attr("aria-pressed", false);

        const $btn = $btns.eq(idx).addClass("on").attr("aria-pressed", true);

        $list.stop().animate({scrollLeft:$btn[0].getBoundingClientRect().left - $list[0].getBoundingClientRect().left + $list.scrollLeft()}, 300);
    }

    const teamSwiper = new Swiper($slider[0], {
        speed:600,
        spaceBetween:300,
        breakpoints:{
            1279:{spaceBetween:80}
        },
        on:{
            slideChange:function(){
                tabUpdate(this.activeIndex);
            }
        }
    });

    /* 고정이 시작되는 스크롤 위치 */
    function pinStart(){
        return $sect.offset().top + parseFloat($sect.css("padding-top")) - pinTop;
    }

    /* 팀 순번에 해당하는 스크롤 위치 */
    function stepTop(idx){
        return Math.round(pinStart() + distance * idx / last);
    }

    function scrollMove(top, isNow){
        if(lenis){
            lenis.scrollTo(top, isNow ? {immediate:true, force:true} : {duration:0.4, lock:true});
        } else {
            window.scrollTo(0, top);
        }
    }

    /* 팀 idx 로 슬라이드와 스크롤을 함께 이동 */
    function stepMove(idx){
        lockTime = performance.now() + stepDelay;
        teamSwiper.slideTo(idx);
        scrollMove(stepTop(idx));
    }

    /* 터치 관성 스크롤을 잠시 멈춤 */
    function touchScrollStop(){
        document.documentElement.style.overflow = "hidden";
        setTimeout(function(){
            document.documentElement.style.overflow = "";
        }, stepDelay);
    }

    /* 스크롤 위치에 해당하는 팀으로 슬라이드 이동, 휠·터치로 고정 구간에 들어올 때는 관성으로 팀을 건너뛰지 않도록 시작(끝) 위치에 맞춤 */
    function scrollUpdate(){
        if(!pinned) return;

        const start = stepTop(0),
            end = stepTop(last),
            now = performance.now();
        let top = $(window).scrollTop();

        if(now > lockTime && now < moveLimit){
            const isDown = prevTop < start - 1 && top >= start - 1,
                isUp = prevTop > end + 1 && top <= end + 1;

            if(isDown || isUp){
                top = isDown ? start : end;
                lockTime = now + stepDelay;
                exitDir = 0;
                prevTop = top;
                if(isTouch) touchScrollStop();
                scrollMove(top, true);
            }
        }
        prevTop = top;
        /* 고정이 시작되면 제목을 숨기고, 위로 벗어나면 다시 표시 (sub.css) */
        $sect.toggleClass("on", top >= start - 1);

        /* 휠·스와이프·탭으로 이동 중에는 슬라이드가 이미 움직이고 있으므로 스크롤 위치를 반영하지 않음 */
        if(now < lockTime) return;

        const idx = Math.round(Math.min(Math.max((top - start) / distance, 0), 1) * last);

        if(idx !== teamSwiper.activeIndex) teamSwiper.slideTo(idx);
    }

    /* 고정 구간의 휠: 한 번에 팀 1개씩만 이동 (이동 중이거나 트랙패드 관성으로 줄어드는 휠은 무시), 처음·마지막 팀에서는 원래 세로 스크롤 */
    function wheelStep(e){
        if(!pinned || e.ctrlKey || !e.deltaY) return;

        const now = performance.now(),
            dir = e.deltaY > 0 ? 1 : -1,
            delta = Math.abs(e.deltaY),
            isNew = now - wheelTime > 80 || delta >= Math.max(wheelDelta, 4),
            top = $(window).scrollTop(),
            idx = teamSwiper.activeIndex + dir;

        wheelTime = now;
        wheelDelta = delta;
        moveLimit = now + 1500;
        isTouch = false;
        scrollUpdate();

        if(top < stepTop(0) - 1 || top > stepTop(last) + 1) return;
        if(now > lockTime && exitDir === dir && (idx < 0 || idx > last)) return;

        if(now > lockTime && isNew){
            exitDir = 0;
            if(idx < 0 || idx > last){
                exitDir = dir;
                return;
            }
            stepMove(idx);
        }
        e.preventDefault();
        e.stopPropagation();
    }

    function touchStart(e){
        touch = e.touches.length === 1 ? {x:e.touches[0].clientX, y:e.touches[0].clientY, mode:"", done:false} : null;
    }

    /* 고정 구간의 터치: 위·왼쪽 스와이프는 다음 팀, 아래·오른쪽 스와이프는 이전 팀으로 한 번에 1개씩만 이동, 처음·마지막 팀에서는 원래 세로 스크롤 */
    function touchStep(e){
        if(!pinned || !touch) return;

        const now = performance.now(),
            moveX = e.touches[0].clientX - touch.x,
            moveY = e.touches[0].clientY - touch.y,
            isX = Math.abs(moveX) > Math.abs(moveY),
            move = isX ? moveX : moveY,
            dir = move < 0 ? 1 : -1,
            idx = teamSwiper.activeIndex + dir;

        if(!move) return;

        moveLimit = now + 3000;
        isTouch = true;

        /* 스와이프를 시작할 때 팀 이동(step)인지 원래 스크롤(scroll)인지 한 번만 판단 */
        if(!touch.mode){
            const top = $(window).scrollTop(),
                isIn = top >= stepTop(0) - 1 && top <= stepTop(last) + 1,
                isList = isX && $(e.target).closest($list).length,
                isEdge = idx < 0 || idx > last;

            touch.mode = e.touches.length > 1 || !isIn || isList || (isEdge && now > lockTime) ? "scroll" : "step";
        }
        if(touch.mode === "scroll" || !e.cancelable) return;

        e.preventDefault();
        e.stopPropagation();

        if(!touch.done && now > lockTime && Math.abs(move) > 24 && idx >= 0 && idx <= last){
            touch.done = true;
            stepMove(idx);
        }
    }

    /* 고정 위치·길이 계산: 팀 영역이 화면 세로 중앙에 오도록 고정 (중앙이 헤더와 겹치면 헤더 아래, 화면보다 크면 하단 탭이 보이는 위치) */
    function pinUpdate(){
        /* 모바일 주소창이 접히고 펼쳐져도 값이 바뀌지 않도록 100svh 높이를 기준으로 함 */
        const winH = $screen.outerHeight() || window.innerHeight,
            headerH = $(".header").outerHeight(),
            fitH = 530;

        $sect.addClass("active");
        $sect[0].style.setProperty("--team-fit", 1);

        /* 767px 이하: 화면보다 길면 여백·이미지(합계 fitH)를 줄여 한 화면에 맞춤 */
        if(mqMo.matches){
            const fit = (winH - headerH - ($team.outerHeight() - fitH)) / fitH;

            $sect[0].style.setProperty("--team-fit", Math.min(Math.max(fit, 0.3), 1));
        }

        pinned = mq.matches || $team.outerHeight() <= winH - headerH + 1;
        teamSwiper.allowTouchMove = !pinned;
        $sect.toggleClass("active", pinned);

        if(!pinned){
            $sect.removeClass("on");
            return;
        }

        const teamH = $team.outerHeight();

        pinTop = Math.min(Math.max((winH - teamH) / 2, headerH), winH - teamH) - ($inner.outerHeight() - teamH);
        distance = winH * scrollRate * last;
        $sect[0].style.setProperty("--team-top", pinTop + "px");
        $sect[0].style.setProperty("--team-distance", distance + "px");
        scrollUpdate();
    }

    $btns.on("click", function(){
        const idx = $btns.index(this);

        if(!pinned){
            teamSwiper.slideTo(idx);
            return;
        }

        stepMove(idx);
    });

    /* 클릭·스크롤바 조작(맨 위로 버튼 등)은 휠·터치 진입 처리에서 제외 */
    window.addEventListener("pointerdown", function(){
        moveLimit = 0;
    });
    window.addEventListener("wheel", wheelStep, {passive:false, capture:true});
    window.addEventListener("touchstart", touchStart, {passive:true, capture:true});
    window.addEventListener("touchmove", touchStep, {passive:false, capture:true});
    $screen.appendTo("body");
    $(window).on("scroll", scrollUpdate).on("resize load", pinUpdate);
    pinUpdate();
}

/* .growth-item .icon-dot: 동작 줄이기 설정에서는 점을 처음 위치에 멈춤 */
function growthDotAction(){
    if(!window.matchMedia("(prefers-reduced-motion:reduce)").matches) return;

    $(".growth-item .icon-dot").each(function(){
        this.setCurrentTime(0);
        this.pauseAnimations();
    });
}

/* .strength-item: 1279px 이하에서 터치하거나 마우스를 올린 카드에 .active → PC hover 와 같은 효과 (sub.css)
   터치는 다른 카드나 카드 바깥을 터치할 때까지 유지, 마우스는 벗어나면 해제 */
function strengthTouchAction(){
    const $items = $(".strength-item"),
        mq = window.matchMedia("(max-width:1279px)");

    if(!$items.length) return;

    function activeSet($item){
        $items.not($item).filter(".active").removeClass("active").trigger("strengthOff");
        if($item.length && !$item.hasClass("active")) $item.addClass("active").trigger("strengthOn");
    }

    document.addEventListener("touchstart", function(e){
        if(mq.matches) activeSet($(e.target).closest(".strength-item"));
    }, {passive:true});

    $items.on("pointerenter", function(e){
        if(mq.matches && e.originalEvent.pointerType === "mouse") activeSet($(this));
    }).on("pointerleave", function(e){
        if(e.originalEvent.pointerType === "mouse") activeSet($());
    });

    mq.addEventListener("change", function(){
        activeSet($());
    });
}
