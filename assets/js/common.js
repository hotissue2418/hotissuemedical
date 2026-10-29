let lenis = null;

$(function() {
    lenisAction();
    cursorFollowAction();
});

/* Lenis 부드러운 스크롤: 네이티브 scroll 이벤트가 그대로 발생하므로 기존 $(window).on("scroll") 로직과 호환 */
function lenisAction(){
    if(typeof Lenis === "undefined") return;

    lenis = new Lenis({
        duration:1.2,
        smoothWheel:true
    });

    function lenisRaf(time){
        lenis.raf(time);
        requestAnimationFrame(lenisRaf);
    }
    requestAnimationFrame(lenisRaf);
}

/* 커스텀 마우스 커서 (PC 전용: 1280px 이상 + 마우스 환경)
   마크업(.cursor-goo, .cursor-ring, SVG 필터)은 페이지에 없으면 여기서 body 끝에 자동 생성 → 신규 페이지는 common.js 만 로드하면 적용됨
   - .cursor-goo : 원 4개가 시간차를 두고 마우스를 따라오는 효과 (SVG goo 필터)
   - .cursor-ring : a, button 위에서 채운 원 대신 1.5배 커진 원형 테두리로 표시 */
function cursorFollowAction(){
    const mq = window.matchMedia("(min-width:1280px) and (hover:hover) and (pointer:fine)"),
        gooey = 0.4,
        hoverSel = "a, button";

    if(!$(".cursor-goo").length){
        $("body").append(
            '<div class="cursor-goo" aria-hidden="true"><div class="blob"></div><div class="blob"></div><div class="blob"></div><div class="blob"></div></div>' +
            '<div class="cursor-ring" aria-hidden="true"></div>' +
            '<svg xmlns="http://www.w3.org/2000/svg" width="0" height="0" style="position:absolute;" aria-hidden="true" focusable="false"><defs><filter id="cursor-goo-filter"><feGaussianBlur in="SourceGraphic" stdDeviation="10" result="my-blur" /><feColorMatrix in="my-blur" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" result="my-gooey" /></filter></defs></svg>'
        );
    }

    const $cursor = $(".cursor-goo"),
        $ring = $(".cursor-ring"),
        $both = $cursor.add($ring),
        items = $cursor.find(".blob").map(function(i, el){ return {el:el, ind:i, x:0, y:0}; }).get();
    let mouse = {x:0, y:0}, rafId = null, started = false;

    function mapRange(num, inMin, inMax, outMin, outMax){
        return (num - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
    }
    function onMove(e){
        mouse.x = e.clientX;
        mouse.y = e.clientY;
        if(!started){
            started = true;
            items.forEach(function(o){ o.x = mouse.x; o.y = mouse.y; });
            $both.addClass("on");
        }
    }
    function render(){
        rafId = requestAnimationFrame(render);
        if(!started) return;
        items.forEach(function(o){
            const distX = mouse.x - o.x,
                distY = mouse.y - o.y;
            o.x += distX / (5 + (o.ind * gooey));
            o.y += distY / (5 + (o.ind * gooey));
            const scale = Math.max(mapRange(Math.abs(distX / 8), 0, 100, 1, 2), mapRange(Math.abs(distY / 8), 0, 100, 1, 2));
            o.el.style.transform = "translate(" + o.x + "px, " + o.y + "px) scale(" + scale + ")";
        });
        /* 링크 위 테두리는 소수점 좌표에서 선이 번져 두꺼워 보이므로 정수로 맞춤 */
        $ring[0].style.transform = "translate(" + Math.round(items[0].x) + "px, " + Math.round(items[0].y) + "px)";
    }
    function hide(){ $both.removeClass("on"); }
    function show(){ if(started) $both.addClass("on"); }
    function hoverOn(){ $both.addClass("hover"); }
    function hoverOff(){ $both.removeClass("hover"); }
    function enable(){
        if(rafId) return;
        window.addEventListener("mousemove", onMove);
        document.addEventListener("mouseleave", hide);
        document.addEventListener("mouseenter", show);
        $(document).on("mouseover.cursorHover", hoverSel, hoverOn).on("mouseout.cursorHover", hoverSel, hoverOff);
        render();
    }
    function disable(){
        $both.removeClass("on hover");
        started = false;
        window.removeEventListener("mousemove", onMove);
        document.removeEventListener("mouseleave", hide);
        document.removeEventListener("mouseenter", show);
        $(document).off(".cursorHover");
        if(rafId){ cancelAnimationFrame(rafId); rafId = null; }
    }
    function check(){ mq.matches ? enable() : disable(); }

    check();
    mq.addEventListener("change", check);
}
