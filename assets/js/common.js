let lenis = null;

$(function() {
    lenisAction();
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
