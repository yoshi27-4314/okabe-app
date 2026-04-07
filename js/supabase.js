/* ===== Supabase接続 ===== */
const SUPABASE_URL = 'https://peportftucwuxfnmaanr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlcG9ydGZ0dWN3dXhmbm1hYW5yIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NDE4NDEsImV4cCI6MjA5MTExNzg0MX0.ssccAf50s-kGjF-VI5MRKAi0hTh1p23MHxdUjxQGRZs';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

/* ===== 顧客 ===== */
async function getCustomers(searchText) {
  let query = db.from('customers').select('*').order('created_at', { ascending: false });
  if (searchText) {
    query = query.or(`name.ilike.%${searchText}%,kana.ilike.%${searchText}%,phone.ilike.%${searchText}%,mobile.ilike.%${searchText}%`);
  }
  const { data, error } = await query;
  if (error) console.error('getCustomers error:', error);
  return data || [];
}

async function getCustomerById(id) {
  const { data, error } = await db.from('customers').select('*').eq('id', id).single();
  if (error) console.error('getCustomerById error:', error);
  return data;
}

async function createCustomer(customer) {
  const { data, error } = await db.from('customers').insert(customer).select().single();
  if (error) console.error('createCustomer error:', error);
  return data;
}

/* ===== 車両 ===== */
async function getVehiclesByCustomer(customerId) {
  const { data, error } = await db.from('vehicles').select('*').eq('customer_id', customerId);
  if (error) console.error('getVehiclesByCustomer error:', error);
  return data || [];
}

async function searchVehicleByPlate(plateNumber) {
  const { data, error } = await db.from('vehicles').select('*, customers(*)').ilike('plate_number', `%${plateNumber}%`);
  if (error) console.error('searchVehicleByPlate error:', error);
  return data || [];
}

async function createVehicle(vehicle) {
  const { data, error } = await db.from('vehicles').insert(vehicle).select().single();
  if (error) console.error('createVehicle error:', error);
  return data;
}

/* ===== タイヤセット ===== */
async function getTireSetsByVehicle(vehicleId) {
  const { data, error } = await db.from('tire_sets').select('*, tires(*), storage_periods(*)').eq('vehicle_id', vehicleId);
  if (error) console.error('getTireSetsByVehicle error:', error);
  return data || [];
}

async function createTireSet(tireSet) {
  const { data, error } = await db.from('tire_sets').insert(tireSet).select().single();
  if (error) console.error('createTireSet error:', error);
  return data;
}

/* ===== タイヤ個別 ===== */
async function createTire(tire) {
  const { data, error } = await db.from('tires').insert(tire).select().single();
  if (error) console.error('createTire error:', error);
  return data;
}

async function updateTire(id, updates) {
  const { data, error } = await db.from('tires').update(updates).eq('id', id).select().single();
  if (error) console.error('updateTire error:', error);
  return data;
}

/* ===== 預かり期間 ===== */
async function createStoragePeriod(period) {
  const { data, error } = await db.from('storage_periods').insert(period).select().single();
  if (error) console.error('createStoragePeriod error:', error);
  return data;
}

async function updateStoragePeriod(id, updates) {
  const { data, error } = await db.from('storage_periods').update(updates).eq('id', id).select().single();
  if (error) console.error('updateStoragePeriod error:', error);
  return data;
}

/* ===== 作業 ===== */
async function getWorksByDate(date) {
  const { data, error } = await db.from('works')
    .select('*, vehicles(*, customers(*)), tire_sets(*, tires(*))')
    .eq('scheduled_date', date)
    .order('scheduled_date', { ascending: true });
  if (error) console.error('getWorksByDate error:', error);
  return data || [];
}

async function getWorksToday() {
  const today = new Date().toISOString().split('T')[0];
  return getWorksByDate(today);
}

async function updateWorkStatus(id, status) {
  const updates = { status };
  if (status === '完了') updates.completed_date = new Date().toISOString().split('T')[0];
  const { data, error } = await db.from('works').update(updates).eq('id', id).select().single();
  if (error) console.error('updateWorkStatus error:', error);
  return data;
}

async function createWork(work) {
  const { data, error } = await db.from('works').insert(work).select().single();
  if (error) console.error('createWork error:', error);
  return data;
}

/* ===== 設定 ===== */
async function getSettings() {
  const { data, error } = await db.from('settings').select('*');
  if (error) console.error('getSettings error:', error);
  return data || [];
}

async function updateSetting(key, value) {
  const { data, error } = await db.from('settings').update({ value, updated_at: new Date().toISOString() }).eq('key', key).select().single();
  if (error) console.error('updateSetting error:', error);
  return data;
}

/* ===== 約款 ===== */
async function getTerms() {
  const { data, error } = await db.from('terms').select('*').order('effective_date', { ascending: false }).limit(1).single();
  if (error) console.error('getTerms error:', error);
  return data;
}

/* ===== 写真 ===== */
async function createPhoto(photo) {
  const { data, error } = await db.from('photos').insert(photo).select().single();
  if (error) console.error('createPhoto error:', error);
  return data;
}

async function getPhotosByTireSet(tireSetId) {
  const { data, error } = await db.from('photos').select('*').eq('tire_set_id', tireSetId);
  if (error) console.error('getPhotosByTireSet error:', error);
  return data || [];
}

/* ===== 残溝判定 ===== */
async function judgeTreadDepth(depth) {
  const settings = await getSettings();
  const good = parseFloat(settings.find(s => s.key === 'tread_good_threshold')?.value || '4');
  const caution = parseFloat(settings.find(s => s.key === 'tread_caution_threshold')?.value || '2');
  const legal = parseFloat(settings.find(s => s.key === 'tread_legal_minimum')?.value || '1.6');

  if (depth >= good) return { level: 'good', label: '良好', color: 'green' };
  if (depth >= caution) return { level: 'caution', label: '要注意', color: 'orange' };
  if (depth >= legal) return { level: 'replace', label: '交換推奨', color: 'red' };
  return { level: 'illegal', label: '使用不可', color: 'red' };
}
