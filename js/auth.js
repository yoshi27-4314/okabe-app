/* ===== 認証・ロール管理 ===== */

// 現在のユーザー情報
let currentUser = null;
let currentStaff = null;

// メールでサインアップ
async function signUp(email, password, name, role) {
  const { data, error } = await db.auth.signUp({ email, password });
  if (error) {
    console.error('signUp error:', error);
    return { error };
  }
  // staffテーブルに登録
  if (data.user) {
    const { data: staffData, error: staffError } = await db.from('staff').insert({
      auth_user_id: data.user.id,
      name: name,
      role: role
    }).select().single();
    if (staffError) console.error('staff insert error:', staffError);
    return { user: data.user, staff: staffData };
  }
  return { user: data.user };
}

// メールでサインイン
async function signIn(email, password) {
  const { data, error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    console.error('signIn error:', error);
    return { error };
  }
  if (data.user) {
    currentUser = data.user;
    // staffテーブルからロール取得
    const { data: staffData } = await db.from('staff')
      .select('*')
      .eq('auth_user_id', data.user.id)
      .single();
    currentStaff = staffData;
    return { user: data.user, staff: staffData };
  }
  return { user: data.user };
}

// サインアウト
async function signOut() {
  await db.auth.signOut();
  currentUser = null;
  currentStaff = null;
}

// 現在のセッション確認
async function getCurrentSession() {
  const { data: { session } } = await db.auth.getSession();
  if (session?.user) {
    currentUser = session.user;
    const { data: staffData } = await db.from('staff')
      .select('*')
      .eq('auth_user_id', session.user.id)
      .single();
    currentStaff = staffData;
    return { user: session.user, staff: staffData };
  }
  return null;
}

// ロール判定
function getRole() {
  return currentStaff?.role || null;
}

function isManager() {
  return getRole() === 'manager';
}

function isOffice() {
  return getRole() === 'office';
}

function isSales() {
  return getRole() === 'sales';
}

function isService() {
  return getRole() === 'service';
}
