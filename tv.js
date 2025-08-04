async function main() {
	const footer = document.createElement('footer');
	footer.className = 'footer';

	const paragraph = document.createElement('p');

	const link = document.createElement('a');
	link.href = '/';
	link.target = '_blank';
	link.textContent = 'Rayhan';
	link.style.color = '#5b9bd5';
	link.style.textDecoration = 'none';

	paragraph.innerHTML = '© Powered by ';
	paragraph.appendChild(link);
	paragraph.innerHTML += ' - Mengandung Hak Cipta.';

	footer.appendChild(paragraph);
	document.body.appendChild(footer);

	const video = document.getElementById('video');
	const titleElement = document.getElementById('video-title');
	const logoElement = document.getElementById('channel-logo');
	const playToggle = document.getElementById('play-toggle');
	const playIcon = document.getElementById('play-icon');
	const fullscreenBtn = document.getElementById('fullscreen-btn');
	const videoWrapper = document.getElementById('video-wrapper');
	const controlOverlay = document.getElementById('control-overlay');
	const channelList = document.getElementById('channel-list');

	const menuToggle = document.getElementById('menu-toggle');
	const sidebar = document.getElementById('sidebar');
	const closeSidebar = document.getElementById('close-sidebar');

	const nextBtn = document.getElementById('next-btn');
	const prevBtn = document.getElementById('prev-btn');

	let playlist;
	try {
		const response = await fetch('/tv-list');
		playlist = await response.json();
		
		Swal.fire({
		  title: `Sukses memuat ${playlist.length} channel!`,
		  html: '<a href="/tip" target="_blank">Klik disini</a> untuk melakukan donasi',
		  icon: 'success'
		});
		
		playlist.sort((a, b) => {
  // Urutkan berdasarkan nama grup dulu, lalu berdasarkan judul
  const groupA = a.group?.toLowerCase() || 'lainnya';
  const groupB = b.group?.toLowerCase() || 'lainnya';

  if (groupA < groupB) return -1;
  if (groupA > groupB) return 1;

  return a.title.localeCompare(b.title);
});
	} catch (err) {
		Swal.fire({
		  title: `Failed!`,
		  html: 'Gagal memuat list channel',
		  icon: 'error'
		});
		console.error("Gagal memuat playlist:", err);
		return;
	}

	let currentIndex = 0;
	let hls;
	let isPlaying = false;
	let hideTimeout;

function loadVideo(index) {
  const current = playlist[index];
  titleElement.textContent = current.title;
  logoElement.src = current.logo;

  if (index > 0) {
    prevBtn.style.display = 'block';
  } else {
    prevBtn.style.display = 'none';
  }

  if (hls) {
    hls.destroy();
    hls = null;
  }

  const url = current.url;
  let fallbackTimeout;

  function fallbackPlayer() {
    if (hls) {
      hls.destroy();
      hls = null;
    }
    console.warn('Fallback ke native player...');
    video.src = url;
    video.load();
    video.play().catch(() => {
      controlOverlay.classList.remove('hidden');
    })
  }

  // Gunakan native HLS jika tersedia
  if (video.canPlayType('application/vnd.apple.mpegurl')) {
    video.src = url;
    video.load();
    video.play().catch(() => {
      controlOverlay.classList.remove('hidden');
      fallbackPlayer();
    });
    return;
  }

  // Gunakan Hls.js jika didukung
  if (Hls.isSupported()) {
    hls = new Hls();
    hls.loadSource(url);
    hls.attachMedia(video);

    let played = false;

    hls.on(Hls.Events.MANIFEST_PARSED, () => {
      video.play().then(() => {
        played = true;
      }).catch(() => {
        controlOverlay.classList.remove('hidden');
      });
    });

    // Pantau apakah video mulai (dalam 3 detik)
    fallbackTimeout = setTimeout(() => {
      if (!played || video.readyState < 2) {
        fallbackPlayer();
      }
    }, 3000);

    // Bersihkan timeout jika berhasil diputar
    video.addEventListener('playing', () => {
      clearTimeout(fallbackTimeout);
    }, { once: true });

    return;
  }

  // Fallback terakhir
  fallbackPlayer();
}

	function playNext() {
		currentIndex = (currentIndex + 1) % playlist.length;
		loadVideo(currentIndex);
	}
	
	window.playNext = playNext;
	
	function playPrev() {
  if (currentIndex > 0) {
    currentIndex -= 1;
    loadVideo(currentIndex);
  }
}

	function togglePlay() {
		if (video.paused) {
			video.play();
			isPlaying = true;
		} else {
			video.pause();
			isPlaying = false;
		}
		updatePlayButton();
	}

	function updatePlayButton() {
		playIcon.innerHTML = isPlaying ?
			'<path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"></path>' :
			'<path d="M8 5v14l11-7z"></path>';
	}

	function showControlsTemporarily() {
		controlOverlay.classList.remove('hidden');
		clearTimeout(hideTimeout);
		hideTimeout = setTimeout(() => {
			controlOverlay.classList.add('hidden');
		}, 2000);
	}

	let controlsVisible = false;

	function toggleControls() {
		if (controlsVisible) {
			controlOverlay.classList.add('hidden');
			controlsVisible = false;
		} else {
			controlOverlay.classList.remove('hidden');
			controlsVisible = true;
		}
	}

	playToggle.addEventListener('click', (e) => {
		e.stopPropagation();
		togglePlay();
		showControlsTemporarily();
	});

	videoWrapper.addEventListener('click', (e) => {
		showControlsTemporarily();
		if (e.target.closest('button')) return;
		toggleControls();
	});

	video.addEventListener('play', () => {
		isPlaying = true;
		updatePlayButton();
	});

	video.addEventListener('pause', () => {
		isPlaying = false;
		updatePlayButton();
	});

	fullscreenBtn.addEventListener('click', (e) => {
		e.stopPropagation();
		if (!document.fullscreenElement) {
			videoWrapper.requestFullscreen().catch(err => {
				alert(`Gagal masuk fullscreen: ${err.message}`);
			});
		} else {
			document.exitFullscreen();
		}
	});

	menuToggle.addEventListener('click', () => {
		const isVisible = sidebar.classList.contains('show');
		if (isVisible) {
			sidebar.classList.remove('show');
			sidebar.classList.add('hidden');
			menuToggle.classList.remove('hidden');
		} else {
			sidebar.classList.remove('hidden');
			sidebar.classList.add('show');
			menuToggle.classList.add('hidden');
		}
	});

	closeSidebar.addEventListener('click', () => {
		sidebar.classList.remove('show');
		sidebar.classList.add('hidden');
		menuToggle.classList.remove('hidden');
	});

		const channelSearchInput = document.getElementById('channel-search');
channelSearchInput.addEventListener('input', () => {
  const keyword = channelSearchInput.value.toLowerCase();
  const allDetails = channelList.querySelectorAll('details');

  allDetails.forEach(details => {
    const listItems = details.querySelectorAll('li');
    let matchFound = false;

    listItems.forEach(item => {
      const text = item.textContent.toLowerCase();
      const isMatch = text.includes(keyword);
      item.style.display = isMatch ? '' : 'none';
      if (isMatch) matchFound = true;
    });

    // Expand grup jika ada yang cocok, sembunyikan seluruh grup jika tidak
    if (matchFound) {
      details.open = true;
      details.style.display = '';
    } else {
      details.open = false;
      details.style.display = 'none';
    }
  });
});
		
const groupMap = {};

// Kelompokkan berdasarkan grup
playlist.forEach((channel, index) => {
  const groupName = channel.group || 'Lainnya';
  if (!groupMap[groupName]) {
    groupMap[groupName] = [];
  }
  groupMap[groupName].push({ ...channel, index });
});

// Urutkan nama grup
const sortedGroupNames = Object.keys(groupMap)
  .filter(name => name.toLowerCase() !== 'lainnya')
  .sort((a, b) => a.toLowerCase().localeCompare(b.toLowerCase()));

if (groupMap['Lainnya']) {
  sortedGroupNames.push('Lainnya');
}

sortedGroupNames.forEach(groupName => {
  const details = document.createElement('details');
  const summary = document.createElement('summary');
  summary.textContent = groupName;
  summary.style.cursor = 'pointer';
  summary.style.padding = '8px 0';
  summary.style.fontWeight = 'bold';
  summary.style.color = '#1e40af';

  details.appendChild(summary);

  const ul = document.createElement('ul');
  ul.style.listStyle = 'none';
  ul.style.paddingLeft = '15px';

  groupMap[groupName]
    .sort((a, b) => a.title.localeCompare(b.title))
    .forEach(channel => {
      const li = document.createElement('li');
      const img = document.createElement('img');
img.src = channel.logo;
img.alt = channel.title;
img.style.width = '20px';
img.style.height = '20px';
img.style.objectFit = 'contain';
img.style.marginRight = '8px';
img.loading = 'lazy';

const span = document.createElement('span');
span.textContent = channel.title;

li.style.display = 'flex';
li.style.alignItems = 'center';

li.appendChild(img);
li.appendChild(span);

      li.style.cursor = 'pointer';
      li.style.margin = '4px 0';
      li.addEventListener('click', () => {
        currentIndex = channel.index;
        loadVideo(currentIndex);
        sidebar.classList.remove('show');
        sidebar.classList.add('hidden');
        menuToggle.classList.remove('hidden');
      });
      ul.appendChild(li);
    });

  details.appendChild(ul);
  channelList.appendChild(details);
});
	
	nextBtn.addEventListener('click', (e) => {
	  e.stopPropagation();
	  playNext();
	  showControlsTemporarily();
	});
	
prevBtn.addEventListener('click', (e) => {
  e.stopPropagation();
  playPrev();
  showControlsTemporarily();
});

	loadVideo(currentIndex);
}
main()