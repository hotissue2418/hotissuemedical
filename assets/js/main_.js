$(function() {
    processScrollSequence();
});

/* sect-process 숫자 영역: 각 항목의 선(.line) 위치가 화면 안으로 올라오는 정도에 따라 왼쪽에서 오른쪽으로 노출
   (항목마다 세로 위치가 달라 01 → 04 순서로 이어서 나타나고, 스크롤을 올리면 반대로 되돌아감) */
function processScrollSequence(){
    const $items = $(".process-scroll .process-item"),
        startRate = 0.9,    /* 항목 선이 화면 높이의 90% 지점에 오면 시작 */
        distRate = 0.3;     /* 화면 높이의 30%만큼 올라오면 완전히 노출 */

    if(!$items.length) return;

    function sequenceUpdate(){
        const winH = $(window).height();

        $items.each(function(){
            const top = $(this).find(".line")[0].getBoundingClientRect().top,
                rate = Math.min(Math.max((winH * startRate - top) / (winH * distRate), 0), 1);

            $(this).css({
                opacity:rate,
                transform:"translateX(" + (-100 * (1 - rate)) + "px)"
            });
        });
    }

    $(window).on("scroll resize", sequenceUpdate);
    sequenceUpdate();
}
