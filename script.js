import { initializeApp } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-app.js";
import { getDatabase, ref, set, get } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-database.js";
import { getAuth, GoogleAuthProvider, signInWithPopup, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.9.3/firebase-auth.js";

// Firebase 配置
const firebaseConfig = {
    apiKey: "AIzaSyDZr1bZBpoZDtHAocExq4Wo5ocJpAiF20U",
    authDomain: "test1-f4425.firebaseapp.com",
    databaseURL: "https://test1-f4425-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "test1-f4425",
    storageBucket: "test1-f4425.firebasestorage.app",
    messagingSenderId: "276599666493",
    appId: "1:276599666493:web:c01a1a3ab7f82516373754",
    measurementId: "G-NTYYF6NNH3"
};

// 初始化 Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

// 獲取勾選框和註冊按鈕
const termsCheckbox = document.getElementById('terms');
const submitButton = document.getElementById('submitBtn');

// 當勾選框狀態改變時，檢查是否已勾選
termsCheckbox.addEventListener('change', function() {
  submitButton.disabled = !termsCheckbox.checked;
});

// 當用戶點擊 "立即登入" 時，切換到登入 tab
document.getElementById('goToLogin').addEventListener('click', function(event) {
  event.preventDefault(); // 防止頁面跳轉
  var myTab = new bootstrap.Tab(document.getElementById('login-tab'));
  myTab.show(); // 顯示登入 tab
});

// 當用戶點擊 "註冊" 時，切換到註冊 tab
document.getElementById('goToRegister').addEventListener('click', function(event) {
  event.preventDefault(); // 防止頁面跳轉
  var myTab = new bootstrap.Tab(document.getElementById('register-tab'));
  myTab.show(); // 顯示註冊 tab
});


// 註冊表單驗證函數，將它綁定到 window 上，這樣就能在 HTML 中調用
window.validateForm = function() {
    // 獲取表單欄位
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const name = document.getElementById('name').value;
  
    let isValid = true;
    let errorMessage = '';
  
    // 清除先前的錯誤訊息
    document.getElementById('emailError').style.display = 'none';
    document.getElementById('passwordError').style.display = 'none';
  
    // 1. 檢查電子郵件格式是否正確
    const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailPattern.test(email)) {
      errorMessage = '請輸入有效的電子郵件地址。';
      document.getElementById('emailError').style.display = 'block';
      isValid = false;
    }
  
    // 2. 檢查兩個密碼欄位是否一致
    if (password !== confirmPassword) {
      errorMessage = '密碼和確認密碼不匹配。';
      document.getElementById('passwordError').style.display = 'block';
      isValid = false;
    }
  
    // 3. 檢查是否同意條款
    if (!termsCheckbox.checked) {
      errorMessage = '請同意條款與條件。';
      isValid = false;
    }
  
    // 如果驗證不通過，彈出失敗提示
    if (!isValid) {
      Swal.fire({
        icon: 'error',
        title: '註冊失敗',
        text: errorMessage
      });
      return false;
    }
  
    // 如果一切正確，將資料寫入 Firebase
    Swal.fire({
      icon: 'success',
      title: '註冊成功',
      text: '您的帳號已成功創建！'
    });
  
    // 將用戶資料寫入 Firebase Realtime Database
    const userRef = ref(database, 'users/' + email.replace(/\./g, ',')); // 這裡將 email 中的 "." 替換為 ","，因為 Firebase 不支持使用 "." 來作為鍵
    set(userRef, {
      name: name,
      email: email,
      password: password
    });
  
    // 可以在這裡執行其他註冊後的處理，例如跳轉頁面或呼叫 API
    return true;
};

// 登入用戶的功能
window.loginUser = function() {
    const email = document.getElementById('loginEmail').value;
    const password = document.getElementById('loginPassword').value;
  
    // 查詢 Firebase 資料庫中該用戶的資料
    const userRef = ref(database, 'users/' + email.replace(/\./g, ',')); // Firebase 不支持 "." 作為鍵，所以我們把 "." 替換為 ","
    
    get(userRef).then((snapshot) => {
      if (snapshot.exists()) {
        const userData = snapshot.val();
        
        // 比對密碼
        if (userData.password === password) {
          // 更新最後登入時間
          const currentTime = new Date().toISOString(); // 使用 ISO 格式的時間戳記
          set(ref(database, 'users/' + email.replace(/\./g, ',')), {
            ...userData,  // 保持用戶資料不變
            lastLogin: currentTime  // 更新最後登入時間
          }).then(() => {
            // 顯示登入成功訊息
            Swal.fire({
              icon: 'success',
              title: `歡迎回來，${userData.name}！`,
              text: `最後登入時間：${currentTime}`,
              imageAlt: 'User Avatar'
            });
            // 隱藏註冊與登入畫面，顯示用戶資料區域
            document.getElementById('RegisterAndLogin').style.display = 'none';

            // 顯示用戶資料
            document.getElementById('userInfo').style.display = 'block';
            document.getElementById('userName').textContent = userData.name;
            document.getElementById('userEmail').textContent = userData.email;
            document.getElementById('userAvatar').src = userData.photoURL || 'images.png'; // 若沒有相片則使用預設圖片
            document.getElementById('lastLoginTime').textContent = currentTime;

          }).catch((error) => {
            console.error("Error updating last login:", error);
            Swal.fire({
              icon: 'error',
              title: '登入失敗',
              text: '系統錯誤，請稍後再試。'
            });
          });
        } else {
          // 密碼錯誤
          Swal.fire({
            icon: 'error',
            title: '登入失敗',
            text: '密碼不正確！'
          });
        }
      } else {
        // 用戶不存在
        Swal.fire({
          icon: 'error',
          title: '登入失敗',
          text: '找不到此帳號！'
        });
      }
    }).catch((error) => {
      console.error("Error fetching user data:", error);
      Swal.fire({
        icon: 'error',
        title: '登入失敗',
        text: '系統錯誤，請稍後再試。'
      });
    });
};

// Google 登入功能
window.googleLogin = function() {
  const provider = new GoogleAuthProvider();
  signInWithPopup(auth, provider)
    .then((result) => {
      const user = result.user;
      const userRef = ref(database, 'users/' + user.email.replace(/\./g, ',')); // 使用 email 來做為 key
      get(userRef).then((snapshot) => {
        if (!snapshot.exists()) {
          // 如果是第一次登入，可以將用戶資料寫入 Firebase
          set(userRef, {
            name: user.displayName,
            email: user.email,
            photoURL: user.photoURL,
            lastLogin: new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' }) // 記錄最後登入時間
          });
        } else {
          // 如果用戶資料已存在，更新最後登入時間
          const currentTime = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
          set(userRef, {
            ...snapshot.val(),
            name: user.displayName,
            photoURL: user.photoURL,
            lastLogin: currentTime
          });
        }
        
        // 隱藏註冊與登入畫面，顯示用戶資料區域
        document.getElementById('RegisterAndLogin').style.display = 'none';

        // 顯示用戶資料
        document.getElementById('userInfo').style.display = 'block';
        document.getElementById('userName').textContent = user.displayName;
        document.getElementById('userEmail').textContent = user.email;
        document.getElementById('userAvatar').src = user.photoURL || 'https://www.example.com/default-avatar.png'; // 若沒有相片則使用預設圖片
        document.getElementById('lastLoginTime').textContent = new Date().toLocaleString('zh-TW', { timeZone: 'Asia/Taipei' });
        Swal.fire({
          icon: 'success',
          title: `歡迎回來，${user.displayName}！`,
          imageUrl: user.photoURL,
          imageAlt: 'User Avatar'
        });
      });
    })
    .catch((error) => {
      console.error("Google Login Error: ", error);
      Swal.fire({
        icon: 'error',
        title: '登入失敗',
        text: error.message
      });
    });
};

// 登出功能
window.logoutUser = function() {
  signOut(auth).then(() => {
    // 顯示註冊和登入畫面
    document.getElementById('RegisterAndLogin').style.display = 'block';

    // 隱藏用戶資料區域
    document.getElementById('userInfo').style.display = 'none';

    Swal.fire({
      icon: 'success',
      title: '已成功登出',
      text: '希望很快再見！'
    });
  }).catch((error) => {
    Swal.fire({
      icon: 'error',
      title: '登出失敗',
      text: error.message
    });
  });
};
