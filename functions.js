console.log("Let's get this party started!!");

// Get news from an api
var apiUrl = 'https://skysportsapi.herokuapp.com/sky/football/getteamnews/manchester-united/v1.0/';
var webtaskUrl = 'https://wt-35ebebfbd89df1d57b51cb02212b9624-0.run.webtask.io/simple-pwa-with-sky-sports-api';

// since cors is being a problem delegate api querying to webtasks
function runWebtask (webtaskUrl){
	return fetch(webtaskUrl).then(function(response) {
		    var contentType = response.headers.get("content-type");
		    if(contentType && contentType.includes("application/json")) {
				return response.json();
		    }
		    throw new TypeError("Oops, we haven't got JSON!");
		})
		.then(function(json) { 
			/* process your JSON further */
			// console.log(json);
			return json;
		})
		.catch(function(error) { console.log(error); });
}


// render single card
function renderCard(newsItem){

	// newsItem data Object example
	// { imgsrc : "http://e1.365dm.com/17/08/16-9/30/skysports-basketball-o2_4080974.jpg?20170823172423"
	// link : "http://www.skysports.com/more-sports/basketball/news/12375/11002095/british-basketball-all-stars-championship-to-take-place-at-londons-o2-live-on-sky-sports"
	// shortdesc : "The British Basketball All-Stars Championship at London's O2 will be shown live on Sky Sports in September. "
	// title : " O2 to host All-Stars Championship " }

	var pageContainer = document.querySelector(".container");
	var newsTemplate = document.querySelector("#news-template");
	var nTC = newsTemplate.content;
	var newsTitle = nTC.querySelector(".news-card-title");
	var newsText = nTC.querySelector(".news-card-p");
	var newsImage = nTC.querySelector(".news-card-img");
	var newsLink = nTC.querySelector(".more-dets a");

	nTC.querySelector('.news-card').classList.add('js-news-card');
	newsTitle.textContent = newsItem.title;
	newsText.textContent = newsItem.shortdesc;
	newsImage.src = newsItem.imgsrc;
	newsLink.href = newsItem.link;

	pageContainer.appendChild(document.importNode(nTC, true));
}

// Put the news on to the page
function displayNews(newsItems){
	newsItems.forEach(function(newsItem){
		renderCard(newsItem);
	});
}




// Showing the toast
function animateToastContainer(text){
	var textToDisplay = text || "hello!";
	var toastContainer = document.querySelector("#toast-container");
	toastContainer.style.display = 'block';
	// toastContainer.classList.toggle('full-opacity');
}


















// service worker functions!!
// 1) ServiceWOrker registration
navigator.serviceWorker && navigator.serviceWorker.register('./sw.js').then(function(registration) {
  console.log('Excellent, registered with scope: ', registration.scope);
});

// 2) ServiceWorker push handling
// navigator.serviceWorker && navigator.serviceWorker.ready.then(function(serviceWorkerRegistration) {  
//   serviceWorkerRegistration.pushManager.getSubscription()  
//     .then(function(subscription) {  
//       // subscription will be null or a PushSubscription
//       if (subscription) {
//         console.info('Got existing', subscription);
//         return;  // got one, yay
//       }
//       serviceWorkerRegistration.pushManager.subscribe({userVisibleOnly: true})
//         .then(function(subscription) { 
//           console.info('Newly subscribed to push!', subscription);
//         });
//     });
// });


function openDatabase() {
  // If the browser doesn't support service worker,
  // we don't care about having a database
  if (!navigator.serviceWorker) {
    return Promise.resolve();
  }

  return idb.open('spwapp', 1, function(upgradeDb) {
    var store = upgradeDb.createObjectStore('spwapp', {
      keyPath: 'title'
    });
    // store.createIndex('by-date', 'time');
  });
}

function showCachedMessages () {

  return openDatabase().then(function(db) {
    // if we're already showing posts, eg shift-refresh
    // or the very first load, there's no point fetching
    // posts from IDB
    var  newsCard = document.querySelector('js-news-card');
    if (!db || !!newsCard) return;

    var index = db.transaction('spwapp')
      .objectStore('spwapp');

    return index.getAll().then(function(newsItems) {
      displayNews(newsItems.reverse());
    });
  });
};

function dealWithFreshNews (data) {
  // var newsItems = JSON.parse(data);
  var newsItems = data;

  console.log("Have gotten fresh news. Check IDB!!");
  displayNews(newsItems);

  return openDatabase().then(function(db) {
    if (!db) return;

    var tx = db.transaction('spwapp', 'readwrite');
    var store = tx.objectStore('spwapp');
    newsItems.forEach(function(newsItem) {
      store.put(newsItem);
    });

    // limit store to 5 items
    store.openCursor(null, "prev").then(function(cursor) {
      return cursor.advance(5);
    }).then(function deleteRest(cursor) {
      if (!cursor) return;
      cursor.delete();
      return cursor.continue().then(deleteRest);
    });
  });
}




function cleanImageCache() {
  return openDatabase().then(function(db) {
    if (!db) return;

    // TODO: open the 'wittr' object store, get all the messages,
    // gather all the photo urls.
    //
    // Open the 'wittr-content-imgs' cache, and delete any entry
    // that you no longer need.

    var imagesNeeded = [];
  
    var tx = db.transaction('spwapp', 'readwrite');
    var store = tx.objectStore('spwapp');

    // limit store to 30 items
    return store.getAll().then(function(newsItems){
      newsItems.forEach(function(newsItem){
        if(newsItem.imgsrc){
          var src = newsItem.imgsrc.replace(/\.jpg\?\d+/, '.jpg');
          imagesNeeded.push(src);
        }
      });

      return caches.open('spwapp-content-imgs');
    }).then(function(cache){
      return cache.keys().then(function(requests){
        requests.forEach(function (request) {
	      
          var url = new URL(request.url);
	      
          if(!imagesNeeded.includes(url.href)){
            cache.delete(request);
          }
        });
      });
    });
  });
}

function removeOldNews(){
	return new Promise( function (resolve, reject){
		document.querySelectorAll('.js-news-card').forEach(
			function(node){node.remove();}
		);
		resolve();
	});
}


// Run the functions
showCachedMessages().then(function(){
	runWebtask(webtaskUrl).then(function(newsItems){
		if(newsItems){
			//delete the stale news and put the fresh ones in
			removeOldNews().then(function(){
				dealWithFreshNews (newsItems).then(function(){
					cleanImageCache();
				});
			});
		}
	});
});

// setInterval(function() {
//     cleanImageCache();
// }, 1000 * 60 * 5);