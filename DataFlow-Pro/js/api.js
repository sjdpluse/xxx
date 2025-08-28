// js/api.js

// --- Supabase Setup ---
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // <-- آدرس پروژه سوپابیس خود را اینجا قرار دهید
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY'; // <-- کلید عمومی سوپابیس خود را اینجا قرار دهید
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
const BUCKET_NAME = 'avatars';

/**
 * Fetches all records from the 'users' table.
 * @returns {Promise<{data: any[], error: any}>}
 */
async function loadDataApi() {
    return await supabase.from('users').select('*').order('id', { ascending: false });
}

/**
 * Searches records in the 'users' table.
 * @param {string} searchTerm - The term to search for.
 * @returns {Promise<{data: any[], error: any}>}
 */
async function searchRecordsApi(searchTerm) {
    return await supabase
        .from('users')
        .select('*')
        .or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`);
}

/**
 * Deletes a record by its ID.
 * @param {number} id - The ID of the record to delete.
 * @returns {Promise<{error: any}>}
 */
async function deleteRecordApi(id) {
    return await supabase.from('users').delete().eq('id', id);
}

/**
 * Saves a record (inserts or updates).
 * @param {string|null} id - The ID of the record to update, or null to insert.
 * @param {object} recordData - The data for the record.
 * @param {File|null} file - The profile picture file to upload.
 * @returns {Promise<{error: any}>}
 */
async function saveRecordApi(id, recordData, file) {
    // Handle file upload if a new file is provided
    if (file) {
        const fileName = `${Date.now()}_${file.name}`;
        const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, file);
        if (uploadError) {
            return { error: uploadError };
        }
        const { data: { publicUrl } } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);
        recordData.profile_pic_url = publicUrl;
    }

    if (id) { // Edit existing record
        return await supabase.from('users').update(recordData).eq('id', id);
    } else { // Add new record
        recordData.joined = new Date().toISOString().split('T')[0];
        return await supabase.from('users').insert([recordData]);
    }
}
