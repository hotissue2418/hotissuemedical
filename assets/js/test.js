/* 3D 애니메이션 테스트 - sx-portfolio WebGL 캐러셀 */
const PORTFOLIO_POSTERS = [
	"../assets/images/test/poster-01.webp",
	"../assets/images/test/poster-02.webp",
	"../assets/images/test/poster-03.webp",
	"../assets/images/test/poster-04.webp",
	"../assets/images/test/poster-05.webp",
	"../assets/images/test/poster-06.webp",
	"../assets/images/test/poster-07.webp",
	"../assets/images/test/poster-08.webp"
];

$(function() {
	portfolioWebglAction();
	portfolioLinkMagnetAction();
});

function portfolioWebglAction(){
	const $section = $("#portfolio"),
		$stage = $section.find(".sx-portfolio__stage"),
		canvas = $stage.find("canvas")[0];

	if(!canvas || typeof THREE === "undefined") return;

	const renderer = new THREE.WebGLRenderer({canvas:canvas, alpha:true, antialias:true}),
		scene = new THREE.Scene(),
		camera = new THREE.PerspectiveCamera(30, 1, 1, 6000),
		loader = new THREE.TextureLoader(),
		tilts = [-0.1, 0.05, -0.03, 0.08, -0.07, 0.04, -0.09, 0.06],
		count = 12,
		posters = [];

	let stageW = 0, stageH = 0, posterH = 0, spacing = 0, radius = 1,
		offset = 0, velocity = 0, dragging = false, lastX = 0, visible = false,
		titleMesh = null, rafId = 0, scrollOffset = 0, scrollProgress = 0.5,
		time = 0;

	renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

	/* 포스터 플레인 생성 */
	const geometry = new THREE.PlaneGeometry(1, 1);
	for(let i = 0; i < count; i++){
		const src = PORTFOLIO_POSTERS[i % PORTFOLIO_POSTERS.length],
			material = new THREE.MeshBasicMaterial({color:0xffffff, side:THREE.DoubleSide}),
			mesh = new THREE.Mesh(geometry, material);
		mesh.userData = {aspect:0.72, index:i};
		scene.add(mesh);
		posters.push(mesh);
		material.map = makeFallbackTexture(i % PORTFOLIO_POSTERS.length);
		loader.load(src, function(tex){
			tex.minFilter = THREE.LinearFilter;
			material.map = tex;
			material.needsUpdate = true;
			mesh.userData.aspect = tex.image.width / tex.image.height;
			layout();
		});
	}

	function makeFallbackTexture(i){
		const c = document.createElement("canvas");
		c.width = 360; c.height = 500;
		const ctx = c.getContext("2d"), g = ctx.createLinearGradient(0, 0, 360, 500);
		g.addColorStop(0, "hsl(" + (i * 45) + ",50%,28%)");
		g.addColorStop(1, "hsl(" + (i * 45 + 60) + ",60%,10%)");
		ctx.fillStyle = g; ctx.fillRect(0, 0, 360, 500);
		ctx.fillStyle = "rgba(255,255,255,.7)"; ctx.font = "700 90px Arial"; ctx.textAlign = "center";
		ctx.fillText(String(i + 1).padStart(2, "0"), 180, 280);
		return new THREE.CanvasTexture(c);
	}

	/* WORKS 타이틀 텍스처 */
	function makeTitle(){
		const c = document.createElement("canvas"), ctx = c.getContext("2d");
		c.width = 1024; c.height = 400;
		ctx.fillStyle = "#e9e9e9";
		ctx.font = "700 300px degular-display, 'Arial Black', Arial, sans-serif";
		ctx.textAlign = "center"; ctx.textBaseline = "middle";
		ctx.fillText("WORKS", 512, 210);
		const tex = new THREE.CanvasTexture(c);
		if(titleMesh){
			titleMesh.material.map.dispose();
			titleMesh.material.map = tex;
			titleMesh.material.needsUpdate = true;
			return;
		}
		titleMesh = new THREE.Mesh(new THREE.PlaneGeometry(1024, 400), new THREE.MeshBasicMaterial({map:tex, transparent:true}));
		scene.add(titleMesh);
	}
	makeTitle();
	if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ makeTitle(); });

	function layout(){
		stageW = $stage.width();
		stageH = $stage.height();
		renderer.setSize(stageW, stageH, false);
		camera.aspect = stageW / stageH;
		camera.position.z = (stageH / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
		camera.updateProjectionMatrix();

		posterH = Math.min(stageH * 0.5, stageW * 0.5);
		spacing = Math.max(posterH * 0.8, stageW * 0.3);
		radius = spacing * count / (Math.PI * 2);

		const titleW = Math.min(stageW * 0.26, 520);
		titleMesh.scale.set(titleW / 1024, titleW / 1024, 1);
		titleMesh.position.set(0, stageH * 0.1, 0);

		posters.forEach(function(mesh){
			mesh.scale.set(posterH * mesh.userData.aspect, posterH, 1);
		});
	}

	function update(){
		time += 0.016;
		if(!dragging) offset += velocity;
		velocity *= 0.94;
		offset -= 0.35;

		posters.forEach(function(mesh, i){
			/* 원통(링) 위에 배치: 각도 = 인덱스 간격 + 드래그/스크롤 오프셋 */
			const angle = i * Math.PI * 2 / count + (offset + scrollOffset) / radius,
				front = (Math.cos(angle) + 1) / 2;

			mesh.position.x = radius * Math.sin(angle);
			mesh.position.y = -stageH * 0.12 + (scrollProgress - 0.5) * stageH * 0.35 + Math.sin(time * 0.8 + i) * 8;
			mesh.position.z = 60 - radius + radius * Math.cos(angle);
			mesh.rotation.order = "YXZ";
			mesh.rotation.y = angle;
			mesh.rotation.x = 0.05;
			mesh.rotation.z = tilts[i % tilts.length] + THREE.MathUtils.clamp(velocity * 0.004, -0.15, 0.15);
			mesh.material.color.setScalar(0.2 + front * 0.8);
		});
		renderer.render(scene, camera);
	}

	function loop(){
		if(!visible) { rafId = 0; return; }
		update();
		rafId = requestAnimationFrame(loop);
	}

	function updateScroll(){
		const rect = $stage[0].getBoundingClientRect(),
			vh = window.innerHeight;
		scrollProgress = THREE.MathUtils.clamp((vh - rect.top) / (vh + rect.height), 0, 1);
		scrollOffset = -rect.top * 0.6;
	}

	/* 드래그 */
	function dragStart(x){ dragging = true; lastX = x; velocity = 0; $stage.addClass("is-dragging"); }
	function dragMove(x){
		if(!dragging) return;
		const dx = x - lastX;
		offset += dx;
		velocity = dx;
		lastX = x;
	}
	function dragEnd(){ dragging = false; $stage.removeClass("is-dragging"); }

	$stage.on("mousedown", function(e){ dragStart(e.clientX); });
	$(window).on("mousemove", function(e){ dragMove(e.clientX); }).on("mouseup", dragEnd);
	$stage.on("touchstart", function(e){ dragStart(e.originalEvent.touches[0].clientX); });
	$stage.on("touchmove", function(e){ dragMove(e.originalEvent.touches[0].clientX); });
	$stage.on("touchend touchcancel", dragEnd);

	$(window).on("resize", layout).on("scroll", updateScroll);

	new IntersectionObserver(function(entries){
		visible = entries[0].isIntersecting;
		if(visible && !rafId) rafId = requestAnimationFrame(loop);
	}, {rootMargin:"200px 0px"}).observe($stage[0]);

	layout();
	updateScroll();
	$section.addClass("is-webgl-ready");
}

function portfolioLinkMagnetAction(){
	const $link = $(".sx-portfolio__link");

	$link.on("mousemove", function(e){
		const rect = this.getBoundingClientRect(),
			dx = e.clientX - (rect.left + rect.width / 2),
			dy = e.clientY - (rect.top + rect.height / 2);
		this.style.setProperty("--sx-link-x", (dx * 0.15) + "px");
		this.style.setProperty("--sx-link-y", (dy * 0.25) + "px");
	}).on("mouseleave", function(){
		this.style.setProperty("--sx-link-x", "0px");
		this.style.setProperty("--sx-link-y", "0px");
	});
}
