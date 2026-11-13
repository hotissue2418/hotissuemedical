$(function() {
    revealTextAction();
    compareSliderAction();
    visualRippleAction();
    visualStickyTop();
});

/* sect-studio-visual sticky 기준점: 섹션이 화면보다 높으면 top 을 (화면높이 - 섹션높이)로 올려
   섹션 바닥까지 스크롤된 뒤 고정 → 다음 섹션이 그 위로 덮으며 올라옴 */
function visualStickyTop(){
    const $sect = $(".sect-studio-visual");

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
