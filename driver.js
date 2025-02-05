// app.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getDatabase, ref, onValue, set, remove, push, update, get } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
const firebaseConfig = {
    apiKey: "AIzaSyCAwPCVPaxoTEV4n4APATlIKh3ppjMeZpk",
    authDomain: "data-c4c20.firebaseapp.com",
    databaseURL: "https://data-c4c20-default-rtdb.firebaseio.com",
    projectId: "data-c4c20",
    storageBucket: "data-c4c20.appspot.com",
    messagingSenderId: "905131784305",
    appId: "1:905131784305:web:440e06647294b0d5e543d0",
    measurementId: "G-YYHDVJP2T1"
};
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const auth = getAuth(app);
let map; 
let driverLatitude, driverLongitude; 
let driverId; 
let driverCircle; // متغير للدائرة حول السائق
let routingControl; 
let currentRideCost; 
let currentActiveRoute; 
let pickupMarker; 
let dropOffMarker; 
let currentUserInfo; // لتخزين معلومات العميل
let currentRideId= null // أضف هذا مع المتغيرات الأخرى في الأعلى
let cancelSound = new Audio('sounds/الغاء.mp3'); // تأكد من المسار الصحيح
document.getElementById('startRide').style.display = 'none';
document.getElementById('logoutBtn').style.display = 'none';
document.getElementById('ridesList').style.display = 'block';

    // المتغيرات العامة
    let isEditing = false;
    let originalDriverData = null;
    let selectedCarLicenseFile = null;
    let selectedIdCardFile = null;
    let selectedLicenseFile = null;
    // إضافة في بداية المتغيرات
let persistedState = JSON.parse(localStorage.getItem('driverState')) || {};

// تحديث حالة التخزين عند أي تغيير
function updatePersistedState(newState) {
  persistedState = {...persistedState, ...newState};
  localStorage.setItem('driverState', JSON.stringify(persistedState));
}
async function resumeInterruptedRide() {
  const rideRef = ref(database, `rides/${currentRideId}`);
  const snapshot = await get(rideRef);
  
  if(snapshot.exists()) {
    const rideData = snapshot.val();
    const pickupCoords = parseCoordinates(rideData.pickupLocation);
    const dropOffCoords = parseCoordinates(rideData.dropOffLocation);
    	  toggleRidesBtn.style.display = "none"; // إخفاء الزر

    // إعادة إنشاء واجهة الرحلة
    confirmRide(rideData, pickupCoords, dropOffCoords, currentRideId);
  } else {
    localStorage.removeItem('driverState');
    loadRides();
  }
}
	
	
document.getElementById("logoutBtn").addEventListener("click", function() {

    // تحويل المستخدم إلى صفحة تسجيل الدخول
    window.location.href = "login.html"; // استبدل "login.html" برابط صفحة تسجيل الدخول الفعلية لديك
});

document.getElementById('profileBtn').addEventListener('click', () => {
	document.getElementById('logoutBtn').style.display = 'block';

  if (document.getElementById('profileContainer')) {
    return;
  }
  showDriverProfile();
});
    async function showDriverProfile() {
document.body.style.backgroundImage = "url('images.jpg')";
      // إخفاء العناصر الأخرى
      document.getElementById('map').style.display = 'none';
      document.getElementById('ridesList').style.display = 'none';
      document.getElementById('confirmArrival').style.display = 'none';

      // جلب بيانات السائق من Firebase
      const driverRef = ref(database, `drives/${driverId}`);
      const snapshot = await get(driverRef);
      const driverData = snapshot.val();
      console.log('Driver Data:', driverData);

      // إنشاء واجهة البروفايل باستخدام تصميم احترافي
      const profileDiv = document.createElement('div');
	  toggleRidesBtn.style.display = "none"; // إخفاء الزر
      profileDiv.id = 'profileContainer';
      profileDiv.className = 'container';
      profileDiv.innerHTML = `
        <h2>بروفايل السائق</h2>
        <!-- معلومات السائق الأساسية -->
        <div class="section">
            <h3>المعلومات الشخصية</h3>
            <div class="form-group">
                <label>الاسم:</label>
                <input type="text" value="${driverData?.fullName || ''}" readonly>
            </div>
            <div class="form-group">
                <label>الهاتف:</label>
                <input type="text" value="${driverData?.phoneNumber || ''}" readonly>
            </div>
            <div class="form-group">
                <label>البريد الإلكتروني:</label>
                <input type="text" value="${driverData?.email || ''}" readonly>
            </div>
        </div>

        <!-- زر العرض الموحد -->
        <button id="combinedInfoBtn">عرض المعلومات الكاملة</button>

        <!-- القسم الموحد للمعلومات والوثائق -->
        <div class="combined-section" id="combinedInfo" style="display:none;">
            <!-- معلومات السيارة -->
            <div class="subsection">
                <h4>معلومات السيارة</h4>
                <div class="form-group">
                    <label>الموديل:</label>
                    <input type="text" value="${driverData?.carModel || ''}" readonly>
                </div>
                <div class="form-group">
                    <label>رقم السيارة:</label>
                    <input type="text" value="${driverData?.carNumber || ''}" readonly>
                </div>
                <div class="form-group">
                    <label>النوع:</label>
                    <input type="text" value="${driverData?.carType || ''}" readonly>
                </div>
            </div>

            <!-- وثائق السائق -->
            <div class="subsection">
                <h4>الوثائق الرسمية</h4>
                <div class="documents-grid">
                    <div class="doc-item">
                        <label>رخصة السيارة</label>
                        <img src="${driverData?.carLicenseImageURL || ''}" class="doc-preview">
                    </div>
                    <div class="doc-item">
                        <label>بطاقة الهوية</label>
                        <img src="${driverData?.idCardImageURL || ''}" class="doc-preview">
                    </div>
                    <div class="doc-item">
                        <label>رخصة القيادة</label>
                        <img src="${driverData?.licenseImageURL || ''}" class="doc-preview">
                    </div>
                </div>
            </div>
        </div>

        <div class="button-group">
            <button id="editProfile">تعديل</button>
            <button id="closeProfile" class="close-btn">إغلاق</button>
        </div>
    `;

    document.body.appendChild(profileDiv);

    // إدارة عرض/إخفاء القسم الموحد
    document.getElementById('combinedInfoBtn').addEventListener('click', () => {
        const infoSection = document.getElementById('combinedInfo');
        infoSection.style.display = infoSection.style.display === 'none' ? 'grid' : 'none';
    });

  // إضافة حدث الزر لعرض معلومات السيارة

      // تفعيل أحداث الأزرار
      document.getElementById('editProfile').addEventListener('click', toggleEditMode);
      document.getElementById('closeProfile').addEventListener('click', closeProfile);

      // أحداث رفع الصور: تخزين الملف المحدد عند تغييره
      document.getElementById('carLicenseImage').addEventListener('change', (e) => {
        selectedCarLicenseFile = e.target.files[0];
      });
      document.getElementById('idCardImage').addEventListener('change', (e) => {
        selectedIdCardFile = e.target.files[0];
      });
      document.getElementById('licenseImage').addEventListener('change', (e) => {
        selectedLicenseFile = e.target.files[0];
      });
    }

    function toggleEditMode() {
      isEditing = !isEditing;
      // تفعيل/تعطيل حقول النصوص
      const textInputs = document.querySelectorAll('#profileContainer input[type="text"]');
      textInputs.forEach(input => {
        input.readOnly = !isEditing;
      });
      // تفعيل/تعطيل رفع الملفات
      document.getElementById('carLicenseImage').disabled = !isEditing;
      document.getElementById('idCardImage').disabled = !isEditing;
      document.getElementById('licenseImage').disabled = !isEditing;

      const editButton = document.getElementById('editProfile');
      if (isEditing) {
        editButton.textContent = 'حفظ التعديلات';
        // حفظ النسخة الأصلية إن رغبت في التراجع لاحقاً
        originalDriverData = {
          fullName: document.getElementById('driverName').value,
          phoneNumber: document.getElementById('driverPhone').value,
          email: document.getElementById('driverEmail').value,
          driverLocation: document.getElementById('driverLocation').value,
          carModel: document.getElementById('carModel').value,
          carNumber: document.getElementById('carNumber').value,
          carType: document.getElementById('carType').value
        };
      } else {
        editButton.textContent = 'تعديل';
        saveProfileChanges();
      }
    }
	
function cleanupResources() {
    if (routingControl) map.removeControl(routingControl);
    if (driverCircle) map.removeLayer(driverCircle);
    // إزالة جميع المستمعين للأحداث...
}
    async function saveProfileChanges() {
      // رفع الصور الجديدة إذا تم اختيارها باستخدام imgBB
      let carLicenseURL = null;
      let idCardURL = null;
      let licenseURL = null;

      try {
        if (selectedCarLicenseFile) {
          carLicenseURL = await uploadImageToImgBB(selectedCarLicenseFile);
        }
        if (selectedIdCardFile) {
          idCardURL = await uploadImageToImgBB(selectedIdCardFile);
        }
        if (selectedLicenseFile) {
          licenseURL = await uploadImageToImgBB(selectedLicenseFile);
        }
      } catch (error) {
        console.error('خطأ في رفع الصور:', error);
        alert('فشل رفع إحدى الصور!');
        return;
      }

      // إعداد البيانات المحدثة استنادًا إلى المدخلات
      const updatedData = {
        fullName: document.getElementById('driverName').value,
        phoneNumber: document.getElementById('driverPhone').value,
        email: document.getElementById('driverEmail').value,
        driverLocation: document.getElementById('driverLocation').value,
        carModel: document.getElementById('carModel').value,
        carNumber: document.getElementById('carNumber').value,
        carType: document.getElementById('carType').value,
        verificationStatus: "pending"
      };
      // تحديث روابط الصور إذا تم رفع صورة جديدة
      if (carLicenseURL) {
        updatedData.carLicenseImageURL = carLicenseURL;
      }
      if (idCardURL) {
        updatedData.idCardImageURL = idCardURL;
      }
      if (licenseURL) {
        updatedData.licenseImageURL = licenseURL;
      }

      try {
        const driverRef = ref(database, `drives/${driverId}`);
        await update(driverRef, updatedData);
        alert('تم التحديث بنجاح!');
	    window.location.href = 'login.html';
      } catch (error) {
        console.error('خطأ في التحديث:', error);
        alert('فشل في التحديث!');
      } finally {
        // إعادة تعيين الملفات المحددة بعد الحفظ
        selectedCarLicenseFile = null;
        selectedIdCardFile = null;
        selectedLicenseFile = null;
      }
    }

// إنشاء زر عرض الرحلات مع علامة صح
const toggleRidesBtn = document.createElement("button");
toggleRidesBtn.innerHTML = "✔ عرض الرحلات";
// تنسيق موضع الزر (يمكنك تعديل الإحداثيات والتنسيقات حسب رغبتك)
toggleRidesBtn.innerHTML = "✔ عرض الرحلات";
toggleRidesBtn.style.position = "absolute";
toggleRidesBtn.style.bottom = "10px";
toggleRidesBtn.style.left = "10px";
toggleRidesBtn.style.zIndex = "1000";
toggleRidesBtn.style.padding = "10px";
toggleRidesBtn.style.background = "#4CAF50";
toggleRidesBtn.style.color = "black";
toggleRidesBtn.style.border = "none";
toggleRidesBtn.style.cursor = "pointer";
toggleRidesBtn.style.fontSize = "10px"; // زيادة حجم الخط
// تأكد من إزالة خاصية right إذا كانت موجودة

document.body.appendChild(toggleRidesBtn);

// حدث الضغط لتبديل عرض/إخفاء قائمة الرحلات
toggleRidesBtn.addEventListener("click", () => {
    const ridesList = document.getElementById("ridesList");
// حدث الضغط لتبديل عرض/إخفاء قائمة الرحلات
    const map = document.getElementById("map");  // افترض أن الخريطة لها ID يسمى "map"
     const profileBtn = document.getElementById("profileBtn");

    // التبديل بين عرض/إخفاء القائمة
    if (ridesList.style.display === "none" || ridesList.style.display === "") {
        // إظهار القائمة وإخفاء الخريطة
        ridesList.style.display = "block";
        map.style.display = "none";  // إخفاء الخريطة عند عرض القائمة
        profileBtn.style.display = "none";
        // تغيير الزر إلى علامة X لإغلاق القائمة
        toggleRidesBtn.textContent = "× إغلاق ";
        toggleRidesBtn.classList.add("close"); // إضافة التنسيق الخاص بالزر لإغلاق القائمة
  // نقل الزر إلى أعلى القائمة
        toggleRidesBtn.style.position = "absolute"; // اجعل الزر ثابتًا في الصفحة
        toggleRidesBtn.style.top = "10px"; // حرك الزر لأعلى
 toggleRidesBtn.style.left = "50%"; // تحديد مكان الزر ليكون في منتصف الصفحة
        toggleRidesBtn.style.transform = "translateX(-50%)"; // لجعل الزر في المنتصف تمامًا	
toggleRidesBtn.style.width = "150px";  // تحديد عرض الزر ليكون ثابت
        toggleRidesBtn.style.height = "40px";  // تحديد ارتفاع الزر ليكون ثابت		
   } else {
        // إخفاء القائمة وإظهار الخريطة
        ridesList.style.display = "none";
        map.style.display = "block";  // إظهار الخريطة عند إخفاء القائمة
        profileBtn.style.display = "block";
	    // تغيير الزر إلى "عرض الرحلات" مرة أخرى
        toggleRidesBtn.textContent = "عرض الرحلات";
        toggleRidesBtn.classList.remove("close"); // إزالة التنسيق الخاص بإغلاق القائمة
        
        // تغيير الزر إلى "عرض الرحلات" مرة أخرى
        toggleRidesBtn.textContent = "عرض الرحلات";
     	 toggleRidesBtn.classList.remove("close"); // إزالة التنسيق الخاص بإغلاق القائمة
         toggleRidesBtn.style.position = "static"; // إعادة الزر إلى وضعه الطبيعي    
	}
	
});


    // دالة لتحويل الملف إلى base64
    function getBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => {
          // استخراج جزء الـ base64 بعد الفاصلة
          const base64String = reader.result.split(',')[1];
          resolve(base64String);
        };
        reader.onerror = error => reject(error);
      });
    }

    // دالة رفع الصورة إلى imgBB باستخدام المفتاح الخاص بك
    async function uploadImageToImgBB(file) {
      const apiKey = "d6b1df3a6b3175d94eb8e9ecdb0efdb2"; // مفتاح imgBB
      try {
        const base64Image = await getBase64(file);
        const formData = new FormData();
        formData.append("image", base64Image);

        const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
          method: "POST",
          body: formData
        });
        const result = await response.json();
        if (result.success) {
          return result.data.url;
        } else {
          console.error("ImgBB Error:", result);
          throw new Error("فشل رفع الصورة إلى imgBB");
        }
      } catch (error) {
        console.error("Error during image upload:", error);
        throw error;
      }
    }

    function closeProfile() {
      const profileContainer = document.getElementById('profileContainer');
      if (profileContainer) {
        profileContainer.remove();
      }
      // إعادة عرض العناصر الأساسية
      document.getElementById('map').style.display = 'block';
      document.getElementById('ridesList').style.display = 'block';
	  document.getElementById('logoutBtn').style.display = 'none';
	   toggleRidesBtn.style.display = "block";

document.body.style.backgroundColor = ''; // لإرجاع الخلفية للحالة الأصلية
// أو إذا استخدمت صورة كخلفية:
document.body.style.backgroundImage = ''; // لإزالة الصورة

    }
// دالة مساعدة لإدارة الصوت
function playStatusSound(soundFile, loop = false) {
    // إيقاف أي صوت سابق
    if (currentSound) {
        currentSound.pause();
        currentSound = null;
    }
    
    // مسح أي تكرار سابق
    if (soundInterval) {
        clearInterval(soundInterval);
        soundInterval = null;
    }
    
    // تهيئة الصوت الجديد
    currentSound = new Audio(soundFile);
    
    // إعداد التكرار إذا لزم الأمر
    if (loop) {
        soundInterval = setInterval(() => {
            currentSound.play().catch(handleAudioError);
        }, 5000);
    }
    
    // التشغيل الأولي
    currentSound.play().catch(handleAudioError);
}

// دالة معالجة الأخطاء
function handleAudioError(error) {
    console.error('خطأ في تشغيل الصوت:', error);
    if (!isAudioEnabled) {
        showAudioPermissionAlert();
    }
}

// طلب تفعيل الصوت
function showAudioPermissionAlert() {
    const alertDiv = document.getElementById('custom-alert');
    alertDiv.innerHTML = `
        ⚠️ يرجى النقر على أي مكان في الصفحة لتفعيل الصوت
        <button onclick="enableAudio()">موافق</button>
    `;
    alertDiv.classList.remove('hidden');
}

// تفعيل الصوت بعد التفاعل
function enableAudio() {
    isAudioEnabled = true;
    document.getElementById('custom-alert').classList.add('hidden');
    // إعادة تشغيل الصوت المعلق
    if (currentSound) currentSound.play().catch(handleAudioError);
}

// تفعيل الصوت عند أول تفاعل
document.addEventListener('click', enableAudio, { once: true });


document.addEventListener('DOMContentLoaded', () => {
    const ridesRef = ref(database, 'rides');
    
    onValue(ridesRef, (snapshot) => {
        const rides = snapshot.val();
        if (rides) {
            Object.keys(rides).forEach(rideId => {
                const ride = rides[rideId];
                
                // عند إلغاء الرحلة
                if (ride.status === 'canceled' && ride.driverId === driverId) {
                    alert('لقد تم إلغاء الرحلة من قبل العميل!');
                    const rideRef = ref(database, `rides/${rideId}`);
                       playStatusSound('الغاء.mp3');
                        console.error("تعذر تشغيل الصوت:", error);
                    };   
 setTimeout(() => {
                const rideRef = ref(database, `rides/${localRideId}`);
                remove(rideRef)
                    .then(() => {
                        console.log("تم الحذف بنجاح!");
                    })
                    .catch((error) => {
                        console.error("خطأ الحذف:", error);
                        alert('❌ فشل الحذف: ' + error.message);
                    });
            }, 6000); // 60,000 مللي ثانية = 1 دقيقة
     				
				   
                
                // التحقق من: 1. الحالة 'end' 2. تطابق driverId
                if (ride.status === 'end' && ride.driverId === currentDriverId) {
                    const endRideRef = ref(database, `end/${rideId}`);
                    const rideRideRef = ref(database, `rides/${rideId}`);
                    
                    // نقل الرحلة مع الحفاظ على نفس الـ ID
                    set(endRideRef, ride)
                        .then(() => remove(rideRideRef))
                        .then(() => console.log(`تم نقل رحلة السائق ${currentDriverId}!`))
                        .catch((error) => console.error("فشل النقل:", error));
                }
            });
        }
    });
}); // <-- هنا كان ينقص قوس إغلاق onValue
 // <-- هنا كان ينقص قوس إغلاق addEventListener
// أضف هذه الدالة في أي مكان في الملف، مثلاً قبل دالة initializeMap
async function getLocationName(latitude, longitude) {
    try {
        const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&accept-language=ar`);
        const data = await response.json();
        return data.display_name || 'موقع غير معروف';
    } catch (error) {
        console.error('خطأ في جلب اسم الموقع:', error);
        return 'موقع غير معروف';
    }
}

// باقي الكود بدون تغيير...
onAuthStateChanged(auth, (user) => {
    if (user) {
        driverId = user.uid; 
        loadDriverData(); 
        initializeMap();
        getCurrentLocation();
   // استعادة الحالة السابقة
    if(persistedState.currentRideId) {
      currentRideId = persistedState.currentRideId;
      resumeInterruptedRide();
    } else {
      loadRides();
    }
  } else {
    alert('لا يوجد مستخدم مسجل الدخول');
  }
});
async function loadDriverData() {
    const driverRef = ref(database, `drives/${driverId}`);
    const snapshot = await get(driverRef);
    currentDriverData = snapshot.val();
}

function initializeMap() {
    map = L.map('map').setView([29.976641, 31.184735], 13); 
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap'
    }).addTo(map);
}
function getCurrentLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.watchPosition((position) => {
            driverLatitude = position.coords.latitude;
            driverLongitude = position.coords.longitude;
            updateDriverLocation();
        }, (error) => {
            console.error("خطأ في الحصول على الموقع:", error);
            alert("يرجى تمكين موقعك الحالي لتتمكن من استخدام التطبيق.");
        });
}else {
        alert("Geolocation is not supported by this browser.");
    }
}
// في نهاية الملف (قبل نهاية الـ DOMContentLoaded)
document.getElementById('cancelRide').onclick = function() {
    const rideId = this.getAttribute('data-ride-id');
    
    if (!rideId) {
        alert("خطأ: لم يتم تحديد الرحلة!");
        return;
    }

    // تحديث الحالة إلى "canceled"
    const rideRef = ref(database, `rides/${rideId}`);
    update(rideRef, { status: "canceled" })
        .then(() => {
            alert("تم إلغاء الرحلة بنجاح!");
        })
        .catch((error) => {
            console.error("فشل الإلغاء:", error);
            alert("حدث خطأ أثناء الإلغاء!");
        });
};
let lastUpdate = 0;
function updateDriverLocation() {
	if (Date.now() - lastUpdate < 20000) return; // تحديث كل 5 ثوانٍ
    lastUpdate = Date.now();
    const driverLocationRef = ref(database, 'drives/' + driverId + '/driverLocation');
    set(driverLocationRef, {
        latitude: driverLatitude,
        longitude: driverLongitude
    });
// تحديث موقع السائق على الخريطة
    if (driverCircle) {
        driverCircle.setLatLng([driverLatitude, driverLongitude]); // تحديث مركز الدائرة
    } else {
        driverCircle = L.circle([driverLatitude, driverLongitude], {
            color: 'blue',
            fillColor: '#30f',
            fillOpacity: 0.5,
            radius: 50 // نصف قطر الدائرة
        }).addTo(map);
    }
}
async function getLocationByIP() {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return {
        latitude: data.latitude,
        longitude: data.longitude
    };
}
async function loadRides() {
    const ridesList = document.getElementById('ridesList');
    ridesList.innerHTML = ''; 
	    ridesList.style.display = 'none';
    
    const ridesRef = ref(database, 'rides');
    onValue(ridesRef, async(snapshot) => {
        snapshot.forEach(childSnapshot => {
            const rideData = childSnapshot.val();
            const rideId = childSnapshot.key;
 // تصفية الرحلات حسب الحالة
            if (rideData.status !== 'new') {
                return; // تخطي الرحلات غير المرغوبة
            }
            const pickupCoords = parseCoordinates(rideData.pickupLocation);
            const dropOffCoords = parseCoordinates(rideData.dropOffLocation);
            if (pickupCoords && dropOffCoords) {
                calculateRouteAndDistance(pickupCoords, dropOffCoords, rideData, rideId);
            } else {
                console.warn(`نقطة الالتقاء أو نقطة الوصول غير صالحة للرحلة ${rideId}`);
            }
        });
    });
}

function parseCoordinates(locationString) {
    if (!locationString) {
        return null; 
    }
    try {
        const coordinates = locationString.split(', ');
        const latitude = parseFloat(coordinates[0].split(': ')[1]);
        const longitude = parseFloat(coordinates[1].split(': ')[1]);
        return { latitude, longitude };
    } catch (error) {
        console.error("خطأ في تحليل الإحداثيات:", error);
        return null;
    }
}
function calculateRouteAndDistance(pickupCoords, dropOffCoords, rideData, rideId) {
    const waypointsToPickup = [
        L.latLng(driverLatitude, driverLongitude),
        L.latLng(pickupCoords.latitude, pickupCoords.longitude)
    ];

    routingControl = L.Routing.control({
        waypoints: waypointsToPickup,
        routeWhileDragging: false,
        createMarker: () => null
    });

    routingControl.on('routesfound', function(e) {
        const distanceToPickup = e.routes[0].summary.totalDistance / 1000; // المسافة بالكيلومترات
        // فلترة الرحلات بحيث تكون المسافة أقل أو تساوي 4 كم
        if (distanceToPickup <= 5) { 
            const timeToPickup = e.routes[0].summary.totalTime / 60; // الوقت بالدقائق
            const waypointsToDropOff = [
                L.latLng(pickupCoords.latitude, pickupCoords.longitude),
                L.latLng(dropOffCoords.latitude, dropOffCoords.longitude)
            ];
            // حساب المسار من نقطة الالتقاء إلى نقطة الوصول
            const dropOffControl = L.Routing.control({
                waypoints: waypointsToDropOff,
                routeWhileDragging: false,
                createMarker: () => null
            });
            dropOffControl.on('routesfound', function(dropOffEvent) {
                const distanceToDropOff = dropOffEvent.routes[0].summary.totalDistance / 1000; // المسافة بالكيلومترات
                const timeToDropOff = dropOffEvent.routes[0].summary.totalTime / 60; // الوقت بالدقائق
                addRideToList(rideData, rideId, distanceToPickup, timeToPickup, distanceToDropOff, timeToDropOff, pickupCoords, dropOffCoords); 
            });
            dropOffControl.setWaypoints(waypointsToDropOff); 
            dropOffControl.route(); 
        }
    });
    routingControl.setWaypoints(waypointsToPickup); 
    routingControl.route(); 
}


async function addRideToList(rideData, rideId, distanceToPickup, timeToPickup, distanceToDropOff, timeToDropOff, pickupCoords, dropOffCoords) {
    const ridesList = document.getElementById('ridesList');
    const rideItem = document.createElement('div');
    rideItem.className = 'ride-item';

    // تحويل إحداثيات نقطة الالتقاء إلى اسم المكان
    const pickupLocationName = await getLocationName(pickupCoords.latitude, pickupCoords.longitude);
    // تحويل إحداثيات نقطة الوصول إلى اسم المكان
    const dropOffLocationName = await getLocationName(dropOffCoords.latitude, dropOffCoords.longitude);

    rideItem.innerHTML = `
        <div class="ride-details">
            <p><strong>نوع الرحلة:</strong> ${rideData.carType}</p>
            <p><strong>التكلفة:</strong> ${rideData.cost} جنيه</p>
            <p><strong>نقطة الالتقاء:</strong> ${pickupLocationName}</p>
            <p><strong>نقطة الوصول:</strong> ${dropOffLocationName}</p>
            <p><strong>المسافة إلى نقطة الالتقاء:</strong> ${distanceToPickup.toFixed(2)} كم</p>
            <p><strong>وقت الوصول إلى نقطة الالتقاء:</strong> ${timeToPickup.toFixed(0)} دقيقة</p>
            <p><strong>المسافة من نقطة الالتقاء إلى نقطة الوصول:</strong> ${distanceToDropOff.toFixed(2)} كم</p>
            <p><strong>الوقت الإجمالي للرحلة:</strong> ${timeToDropOff.toFixed(0)} دقيقة</p>
        </div>
        <div class="ride-actions">
            <button id="confirmBtn-${rideId}" class="btn btn-primary" data-ride-id="${rideId}" data-pickup-lat="${pickupCoords.latitude}" data-pickup-lng="${pickupCoords.longitude}" data-dropoff-lat="${dropOffCoords.latitude}" data-dropoff-lng="${dropOffCoords.longitude}">
                تأكيد الرحلة
            </button>
        </div>
    `;
    ridesList.appendChild(rideItem);
    // إضافة حدث الضغط على زر "تأكيد الرحلة"
    document.getElementById(`confirmBtn-${rideId}`).onclick = (event) => {
		toggleRidesBtn.style.display = "none"; // إخفاء الزر
            document.getElementById('map').style.display = 'block';

	    const pickupCoords = {
            latitude: parseFloat(event.target.getAttribute('data-pickup-lat')),
            longitude: parseFloat(event.target.getAttribute('data-pickup-lng'))
        };
        const dropOffCoords = {
            latitude: parseFloat(event.target.getAttribute('data-dropoff-lat')),
            longitude: parseFloat(event.target.getAttribute('data-dropoff-lng'))
        };
        confirmRide(rideData, pickupCoords, dropOffCoords, rideId); // تمرير ID الرحلة
    };
}
function confirmRide(rideData, pickupCoords, dropOffCoords, rideId) {
    currentRideCost = rideData.cost; // تخزين تكلفة الرحلة الحالية
	currentRideId = rideId; // <-- تعيين المعرف هنا أيضاً
    updatePersistedState({currentRideId}); // حفظ الحالة
	const userId = rideData.userId; 
    const userRef = ref(database, 'users/' + userId); 

    onValue(userRef, (snapshot) => {
        const userData = snapshot.val();
        currentUserInfo = {
            fullName: userData ? userData.fullName : 'غير متوفر',
            phoneNumber: userData ? userData.phoneNumber : 'غير متوفر',
            email: userData ? userData.email : 'غير متوفر'
        };

        alert(`تم تأكيد الرحلة!

        العميل: ${currentUserInfo.fullName}
        نوع الرحلة: ${rideData.carType}
        سعر الرحلة: ${rideData.cost}
        نقطة الالتقاء: ${rideData.pickupLocation}
        نقطة الوصول: ${rideData.dropOffLocation}
        رقم الهاتف: ${currentUserInfo.phoneNumber}
        البريد الإلكتروني: ${currentUserInfo.email}`);
   // إعداد البيانات للرحلة المؤكدة
const rideRef = ref(database, `rides/${userId}`); // استخدام نفس المسار الأصلي

const updateData = {
    status: "ok",
    driverId: driverId // إضافة حقل السائق
};
document.getElementById('cancelRide').style.display = 'block';
    document.getElementById('cancelRide').setAttribute('data-ride-id', rideId);

// تحديث الحقول المحددة فقط
update(rideRef, updateData)
    .then(() => {
        console.log("✅ تم تحديث حالة الرحلة وإضافة السائق بنجاح");
    })
    .catch((error) => {
        console.error("❗ حدث خطأ في التحديث:", error);
        alert("حدث خطأ أثناء تحديث البيانات!");
    });
       
    // مراقبة حالة الإلغاء بعد التأكيد
    const rideStatusRef = ref(database, `rides/${rideId}/status`);
    onValue(rideStatusRef, (snapshot) => {
        if (snapshot.val() === 'canceled') {
			  localStorage.removeItem('driverState'); // إضافة هذا السطر
			// تشغيل الصوت
            cancelSound.play().catch(error => {
                console.error("تعذر تشغيل الصوت:", error);
            });
            alert('⚠️ لقد ألغى العميل الرحلة! سيتم إعادة التوجيه...');
            // إعادة تعيين الواجهة
            document.getElementById('ridesList').style.display = 'block';
            document.getElementById('confirmArrival').style.display = 'none';
            if (currentActiveRoute) map.removeLayer(currentActiveRoute);
            if (pickupMarker) map.removeLayer(pickupMarker);
            if (dropOffMarker) map.removeLayer(dropOffMarker);
            // نسخ rideId في متغير محلي
            const localRideId = rideId;

            setTimeout(() => {
                const rideRef = ref(database, `rides/${localRideId}`);
                remove(rideRef)
                    .then(() => {
                        console.log("تم الحذف بنجاح!");
                        // تأخير إعادة التحميل 5 ثوانٍ بعد الحذف
                        setTimeout(() => {
                            location.reload();
                        }, 3000); // 5000 مللي ثانية = 5 ثوانٍ
                    })
                    .catch((error) => {
                        console.error("خطأ الحذف:", error);
                        alert('❌ فشل الحذف: ' + error.message);
                    });
            }, 2000); // 10 ثواني
		 
        }
    });
    document.getElementById('profileBtn').style.display = 'none';

        // إخفاء قائمة الرحلات
        document.getElementById('ridesList').style.display = 'none';
 
        // رسم المسار من موقع السائق إلى نقطة الالتقاء
        const routingControl = L.Routing.control({
            waypoints: [
                L.latLng(driverLatitude, driverLongitude),
                L.latLng(pickupCoords.latitude, pickupCoords.longitude)
            ],
            routeWhileDragging: false,
            createMarker: () => null
        });

        routingControl.on('routesfound', function(e) {
            currentActiveRoute = L.polyline(e.routes[0].coordinates, { color: 'blue' }).addTo(map); // رسم المسار
            // وضع دبوس لنقطة الالتقاء
            pickupMarker = L.marker([pickupCoords.latitude, pickupCoords.longitude]).addTo(map).bindPopup('نقطة الالتقاء').openPopup();
            // وضع دائرة حول موقع السائق
            L.circle([driverLatitude, driverLongitude], { 
                color: 'blue', 
                radius: 50, 
                fillOpacity: 0.5 
            }).addTo(map);
        });
        routingControl.route(); // بدء حساب المسار مرة أخرى لتأكيد الرسم
        // فتح Google Maps مباشرةً لبدء التنقل
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${driverLatitude},${driverLongitude}&destination=${pickupCoords.latitude},${pickupCoords.longitude}&travelmode=driving&dir_action=navigate`;
        window.open(googleMapsUrl, '_blank'); // فتح الرابط في نافذة جديدة
        
		
		// عرض زر تأكيد الوصول
        document.getElementById('confirmArrival').style.display = 'block';
	    document.getElementById('map').style.display = 'block';

        document.getElementById('confirmArrival').setAttribute('data-pickup-lat', pickupCoords.latitude);
        document.getElementById('confirmArrival').setAttribute('data-pickup-lng', pickupCoords.longitude);
        document.getElementById('confirmArrival').setAttribute('data-dropoff-lat', dropOffCoords.latitude);
        document.getElementById('confirmArrival').setAttribute('data-dropoff-lng', dropOffCoords.longitude);
        // إضافة زر معلومات العميل
        const clientInfoButton = document.createElement('button');
        clientInfoButton.innerHTML = 'معلومات العميل';
        clientInfoButton.id = 'clientInfoBtn';
        document.getElementById('confirmArrival').after(clientInfoButton);
        // إضافة حدث للزر "معلومات العميل"

        clientInfoButton.onclick = function() {

            const infoDiv = document.getElementById('clientInfo');

            if (infoDiv) {

                infoDiv.remove(); // إذا كان العنصر موجودًا، قم بحذفه

            } else {

                const infoDiv = document.createElement('div');

                infoDiv.id = 'clientInfo';

                infoDiv.innerHTML = `

                    <strong>معلومات العميل:</strong><br>

                    الاسم: ${currentUserInfo.fullName}<br>

                    رقم الهاتف: ${currentUserInfo.phoneNumber}<br>

                    البريد الإلكتروني: ${currentUserInfo.email}

                `;

                document.body.appendChild(infoDiv);

            }

        };

    });

}



window.collectPayment = function() {

	   if (!currentRideId) {

        alert("خطأ: لم يتم تحديد الرحلة!");

        return;

    }
    const ridesRideRef = ref(database, `rides/${currentRideId}`);
    // 1. تحديث الحالة فقط إلى "تم" دون نقل الرحلة
    const rideRef = ref(database, `rides/${currentRideId}`);
    update(rideRef, { status: 'end' })
	
        .then(() => {    
        
    // إخفاء الخريطة وجميع العناصر
    document.getElementById('map').style.display = 'none';
    document.getElementById('ridesList').style.display = 'none';
    document.getElementById('confirmArrival').style.display = 'none';
    document.getElementById('collectPayment').style.display = 'none';
   
    // إنشاء مربع الرسالة
    const messageBox = document.createElement('div');
    messageBox.className = 'message-box';
    messageBox.innerHTML = `
        <h2>تم تحصيل النقود بنجاح!</h2>
        <p>سعر الرحلة: ${currentRideCost} جنيها</p>
        <button id="confirmPaymentBtn">تم التحصيل</button>
    `;

    document.body.appendChild(messageBox);
    // إضافة حدث للزر "تم التحصيل"
	
    document.getElementById('confirmPaymentBtn').onclick = async () => {
               location.reload(); // إعادة التحميل المباشرة
            };
        })
        .then(() => {
           localStorage.removeItem('driverState'); // مسح الحالة المحفوظة            
        });
};
window.confirmArrival = function() {
    const pickupLat = parseFloat(document.getElementById('confirmArrival').getAttribute('data-pickup-lat'));
    const pickupLng = parseFloat(document.getElementById('confirmArrival').getAttribute('data-pickup-lng'));
    const dropOffLat = parseFloat(document.getElementById('confirmArrival').getAttribute('data-dropoff-lat'));
    const dropOffLng = parseFloat(document.getElementById('confirmArrival').getAttribute('data-dropoff-lng'));

    const pickupCoords = {
        latitude: pickupLat,
        longitude: pickupLng,
    };

    const dropOffCoords = {
        latitude: dropOffLat,
        longitude: dropOffLng,
    };

    // إزالة المسار الحالي
    if (currentActiveRoute) {
        map.removeLayer(currentActiveRoute); // إزالة المسار السابق
    }

    // إزالة الدبابيس السابقة إذا كانت موجودة

    if (pickupMarker) {
        map.removeLayer(pickupMarker);
    }
	
    if (dropOffMarker) {
        map.removeLayer(dropOffMarker);
		
    }
    alert("تم تأكيد وصولك إلى نقطة الالتقاء!");

// نقل الرحلة من confirmedRides إلى ready
     // تحديث الحالة في rides
    const rideRef = ref(database, `rides/${currentRideId}/status`);
    set(rideRef, "com")
        .then(() => {
            console.log("تم تحديث الحالة إلى 'com' بنجاح.");
        })
        .catch((error) => {
            console.error("حدث خطأ أثناء تحديث الحالة:", error);
        });
	// إظهار أزرار البدء ومعلومات العميل
	toggleRidesBtn.style.display = "none"; // إخفاء الزر
    document.getElementById('startRide').style.display = 'block';
    document.getElementById('clientInfoBtn').style.display = 'block';
    // إخفاء زر تأكيد الوصول
    document.getElementById('confirmArrival').style.display = 'none';

window.startRide = function() {
    // 1. التحقق من وجود معرف الرحلة
    if (!currentRideId) {
        alert("خطأ: لم يتم تحديد الرحلة!");
        return;
    }

    // 2. تحديث الحالة في قاعدة البيانات إلى 'redy'
    const rideRef = ref(database, `rides/${currentRideId}`);
    update(rideRef, { status: 'redy' })
        .then(() => {
			
			toggleRidesBtn.style.display = "none"; // إخفاء الزر
            // 3. إخفاء زر البدء وإظهار زر التحصيل
            document.getElementById('startRide').style.display = 'none';
            document.getElementById('collectPayment').style.display = 'block';

            // 4. فتح خرائط جوجل (تأكد من تعريف pickupCoords و dropOffCoords)
            const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${pickupCoords.latitude},${pickupCoords.longitude}&destination=${dropOffCoords.latitude},${dropOffCoords.longitude}&travelmode=driving&dir_action=navigate`;
            window.open(googleMapsUrl, '_blank');

            // (إختياري) إظهار رسالة تأكيد
            alert("تم بدء الرحلة بنجاح!");
        })
        .catch((error) => {
            console.error("فشل تحديث الحالة:", error);
            alert("حدث خطأ أثناء بدء الرحلة!");
        });
};
    // رسم المسار من نقطة الالتقاء إلى نقطة الوصول
    const waypointsToDropOff = [
        L.latLng(pickupCoords.latitude, pickupCoords.longitude), // نقطة الالتقاء
        L.latLng(dropOffCoords.latitude, dropOffCoords.longitude) // نقطة الوصول
    ];

    const dropOffRoutingControl = L.Routing.control({
        waypoints: waypointsToDropOff,
        routeWhileDragging: false,
        createMarker: () => null,

    });

    dropOffRoutingControl.on('routesfound', function (e) {
        currentActiveRoute = L.polyline(e.routes[0].coordinates, { color: 'green' }).addTo(map); // رسم المسار الجديد
        // وضع دبوس لنقطة الوصول
        dropOffMarker = L.marker([dropOffCoords.latitude, dropOffCoords.longitude]).addTo(map).bindPopup('نقطة الوصول').openPopup();		
      // وضع دائرة حول نقطة الالتقاء
        L.circle([pickupCoords.latitude, pickupCoords.longitude], { 
            color: 'yellow', 
            radius: 50, 
            fillOpacity: 0.5 
        }).addTo(map);

    });

    dropOffRoutingControl.route(); // بدء حساب المسار
    // إظهار زر "تحصيل النقود" بعد فتح Google Maps
    // إخفاء زر "تأكيد الوصول"
    document.getElementById('confirmArrival').style.display = 'none';
}
function refreshRides() {
    loadRides(); // تحديث قائمة الرحلات
}
