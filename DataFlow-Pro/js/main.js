// js/main.js

document.addEventListener('DOMContentLoaded', async () => {
    // --- Global State ---
    let allData = [];
    let currentData = [];
    let sortDirection = {};

    // --- DOM Elements ---
    const tableBody = document.getElementById('tableBody');
    const searchInput = document.getElementById('searchInput');
    const tableLoading = document.getElementById('tableLoading');
    const recordForm = document.getElementById('recordForm');
    const navItems = document.querySelectorAll('.nav-item');
    const contentSections = document.querySelectorAll('.content-section');

    // --- Main App Logic ---
    async function initializeApp() {
        tableLoading.classList.add('show');
        const { data, error } = await loadDataApi();
        tableLoading.classList.remove('show');

        if (error) {
            showToast('Failed to load data from database.', 'error');
            allData = [];
        } else {
            allData = data;
        }
        currentData = [...allData];
        
        renderTable(tableBody, currentData);
        updateDashboardStats(allData);
        // renderAnalyticsCharts(allData); // You'll need to implement this in ui.js
        // renderAnalyticsInsights(allData); // You'll need to implement this in ui.js
    }

    // --- Event Handlers ---
    window.editRecordHandler = (id) => {
        const record = allData.find(r => r.id === id);
        if (record) openModal('addRecordModal', record);
    };

    window.deleteRecordHandler = async (id) => {
        if (confirm('Are you sure you want to delete this record?')) {
            const { error } = await deleteRecordApi(id);
            if (error) {
                showToast(`Error deleting record: ${error.message}`, 'error');
            } else {
                showToast('Record deleted successfully!', 'error');
                await initializeApp(); // Reload all data
            }
        }
    };
    
    window.viewRecordHandler = (id) => {
        // Implement or move the viewRecord logic here or in ui.js
        const record = allData.find(r => r.id === id);
        if (record) {
            // openViewModal(record); // This function should be in ui.js
            console.log("Viewing record:", record);
            showToast("View functionality to be implemented.", "success");
        }
    };

    recordForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = recordForm.recordId.value;
        const file = recordForm.profile_pic_file.files[0];
        const recordData = {
            first_name: recordForm.first_name.value,
            last_name: recordForm.last_name.value,
            email: recordForm.email.value,
            phone: recordForm.phone.value,
            company: recordForm.company.value,
            role: recordForm.role.value,
            assigned_to: recordForm.assigned_to.value,
            documents: recordForm.documents.value.split(',').map(d => d.trim()).filter(d => d),
            notes: recordForm.notes.value,
            status: recordForm.status.value,
            profile_pic_url: recordForm.profile_pic_url.value, // Keep existing URL if no new file
        };

        const { error } = await saveRecordApi(id, recordData, file);

        if (error) {
            showToast(`Error saving record: ${error.message}`, 'error');
        } else {
            showToast(`Record ${id ? 'updated' : 'added'} successfully!`, 'success');
            closeModal('addRecordModal');
            await initializeApp(); // Reload all data
        }
    });

    searchInput.addEventListener('keyup', async (e) => {
        if (e.key === 'Enter' || searchInput.value.length === 0 || searchInput.value.length > 2) {
            tableLoading.classList.add('show');
            const { data, error } = await searchRecordsApi(searchInput.value);
            tableLoading.classList.remove('show');
            if (error) {
                showToast('Search failed', 'error');
            } else {
                currentData = data;
                renderTable(tableBody, currentData);
            }
        }
    });

    navItems.forEach(item => {
        item.addEventListener('click', () => {
            navItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const sectionId = item.getAttribute('data-section');
            contentSections.forEach(section => {
                section.style.display = section.id === sectionId ? 'block' : 'none';
            });
        });
    });

    // --- Intro Screen Logic ---
    const introScreen = document.getElementById('introScreen');
    const startAppBtn = document.getElementById('startAppBtn');
    const mainApp = document.getElementById('mainApp');
    startAppBtn.addEventListener('click', () => {
        introScreen.classList.add('hidden');
        mainApp.style.display = 'block';
    });
    // typeEffect(document.getElementById('developer-name'), 'Developed by Sajad Mohammadi', 100); // This function needs to be in ui.js

    // --- Initial Call ---
    await initializeApp();
});
