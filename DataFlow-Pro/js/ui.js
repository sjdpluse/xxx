// js/ui.js


// --- Global Chart Variables ---
let userGrowthChart = null;
let userStatusChart = null;

// --- UI Rendering Functions ---

function renderTable(tableBody, data) {
    tableBody.innerHTML = '';
    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="5" style="text-align: center; padding: 40px;">No records found.</td></tr>`;
        return;
    }
    data.forEach(row => {
        const fullName = `${row.first_name || ''} ${row.last_name || ''}`.trim();
        const avatar = row.profile_pic_url
            ? `<img src="${row.profile_pic_url}" alt="${fullName}" class="avatar">`
            : `<div class="avatar">${(row.first_name?.[0] || '')}${(row.last_name?.[0] || '')}</div>`;

        const docCount = row.documents ? row.documents.length : 0;
        const docButton = `<button class="btn" style="padding: 5px 10px; font-size: 12px; background: #1e293b;" onclick="event.stopPropagation(); showToast('${docCount} documents found.')">${docCount} <i class="fas fa-folder"></i></button>`;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="user-profile-cell">
                ${avatar}
                <div class="user-info">
                    <div class="user-name truncate" title="${fullName}">${fullName}</div>
                    <div class="user-id">ID: ${row.id}</div>
                </div>
            </td>
            <td class="truncate" title="${row.email}">${row.email || 'N/A'}</td>
            <td><span class="status-badge status-${row.status}">${row.status}</span></td>
            <td>${docButton}</td>
            <td class="action-buttons">
                <button class="action-btn edit-btn" onclick="viewRecordHandler(${row.id})"><i class="fas fa-eye"></i></button>
                <button class="action-btn edit-btn" onclick="editRecordHandler(${row.id})"><i class="fas fa-edit"></i></button>
                <button class="action-btn delete-btn" onclick="deleteRecordHandler(${row.id})"><i class="fas fa-trash"></i></button>
            </td>
        `;
        tableBody.appendChild(tr);
    });
}

function updateDashboardStats(data) {
    const recordCount = data.length;
    const statusCounts = data.reduce((acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1;
        return acc;
    }, { active: 0, inactive: 0, pending: 0, new: 0, contacted: 0 });

    document.getElementById('tableCount').textContent = `${data.length > 0 ? 1 : 0} Tables`; // Assuming one table for now
    document.getElementById('recordCount').textContent = `${recordCount} Records`;
    document.getElementById('userCount').textContent = statusCounts.active || 0;
    document.getElementById('inactiveUserCount').textContent = statusCounts.inactive || 0;
    document.getElementById('pendingUserCount').textContent = statusCounts.pending || 0;
    document.getElementById('newUserCount').textContent = statusCounts.new || 0;
    document.getElementById('contactedUserCount').textContent = statusCounts.contacted || 0;
    document.getElementById('totalRecordCount').textContent = recordCount;
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast show toast-${type}`;
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function openModal(modalId, record = null) {
    const modal = document.getElementById(modalId);
    const form = document.getElementById('recordForm');
    const title = document.getElementById('modalTitle');
    const preview = document.getElementById('profilePicPreview');

    form.reset();
    if (record) {
        title.textContent = 'Edit Record';
        form.recordId.value = record.id;
        form.first_name.value = record.first_name || '';
        form.last_name.value = record.last_name || '';
        form.email.value = record.email || '';
        form.phone.value = record.phone || '';
        form.company.value = record.company || '';
        form.role.value = record.role || '';
        form.assigned_to.value = record.assigned_to || '';
        form.profile_pic_url.value = record.profile_pic_url || '';
        preview.src = record.profile_pic_url || '';
        form.documents.value = record.documents ? record.documents.join(', ') : '';
        form.notes.value = record.notes || '';
        form.status.value = record.status || 'new';
    } else {
        title.textContent = 'Add New Record';
        form.recordId.value = '';
        preview.src = '';
    }
    modal.classList.add('show');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('show');
}

function runQuery(data) {
    const query = document.getElementById('queryText').value;
    const resultEl = document.getElementById('queryResult');
    if (!query.trim()) {
        resultEl.innerHTML = '<p style="color: #ef4444;">Query cannot be empty.</p>';
        return;
    }
    try {
        alasql.tables.users = { data: data };
        const results = alasql(query);
        // ... (rest of the runQuery logic from original file)
        if (results.length === 0) {
            resultEl.innerHTML = '<p>Query executed successfully, but returned no results.</p>';
        } else {
            let tableHTML = '<table style="width: 100%; border-collapse: collapse; font-family: inherit;"><thead><tr>';
            const headers = Object.keys(results[0]);
            headers.forEach(header => {
                tableHTML += `<th style="padding: 12px 15px; text-align: left; border-bottom: 1px solid rgba(99, 102, 241, 0.3); background: rgba(99, 102, 241, 0.2);">${header}</th>`;
            });
            tableHTML += '</tr></thead><tbody>';
            results.forEach(row => {
                tableHTML += '<tr>';
                headers.forEach(header => {
                    let cellValue = row[header];
                    if (typeof cellValue === 'object' && cellValue !== null) {
                        cellValue = JSON.stringify(cellValue);
                    }
                    tableHTML += `<td style="padding: 12px 15px; border-bottom: 1px solid rgba(99, 102, 241, 0.1);">${cellValue}</td>`;
                });
                tableHTML += '</tr>';
            });
            tableHTML += '</tbody></table>';
            resultEl.innerHTML = tableHTML;
        }
        showToast('Query executed successfully!', 'success');
    } catch (e) {
        resultEl.innerHTML = `<p style="color: #ef4444; font-weight: bold;">Query Error:</p><pre style="color: #fca5a5; background: rgba(239, 68, 68, 0.1); padding: 10px; border-radius: 8px; white-space: pre-wrap;">${e.message}</pre>`;
        showToast('Query failed!', 'error');
    }
}

function openViewModal(record) {
    const modal = document.getElementById('viewRecordModal');
    const content = document.getElementById('viewRecordContent');
    const fullName = `${record.first_name || ''} ${record.last_name || ''}`.trim();

    const avatar = record.profile_pic_url
        ? `<img src="${record.profile_pic_url}" alt="${fullName}" class="view-profile-avatar">`
        : `<div class="view-profile-avatar">${(record.first_name?.[0] || '')}${(record.last_name?.[0] || '')}</div>`;

    const documentsHTML = record.documents && record.documents.length > 0
        ? record.documents.map(doc => `<span class="doc-item" style="background: rgba(99, 102, 241, 0.2); color: #a5b4fc; padding: 5px 12px; border-radius: 20px; font-size: 12px; display: inline-flex; align-items: center; gap: 5px;"><i class="fas fa-file-alt"></i> ${doc}</span>`).join('')
        : '<span class="value" style="color: rgba(244, 244, 245, 0.6);">No documents</span>';

    content.innerHTML = `
        <div class="view-profile-header" style="display: flex; align-items: center; gap: 30px; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 1px solid rgba(99, 102, 241, 0.2);">
            ${avatar}
            <div class="view-profile-details">
                <h2>${fullName}</h2>
                <p class="role">${record.role || 'No role specified'}</p>
                <div style="display: flex; gap: 15px; align-items: center; margin-top: 10px;">
                    <span class="status-badge status-${record.status}">${record.status}</span>
                    <span class="user-id" style="font-size: 14px;">ID: ${record.id}</span>
                </div>
            </div>
        </div>

        <div class="details-grid" style="grid-template-columns: 1fr 1fr;">
            <div class="detail-item"><div class="label">Email Address</div><div class="value">${record.email || 'N/A'}</div></div>
            <div class="detail-item"><div class="label">Phone Number</div><div class="value">${record.phone || 'N/A'}</div></div>
            <div class="detail-item"><div class="label">Company</div><div class="value">${record.company || 'N/A'}</div></div>
            <div class="detail-item"><div class="label">Assigned To</div><div class="value">${record.assigned_to || 'N/A'}</div></div>
            <div class="detail-item"><div class="label">Joined Date</div><div class="value">${record.joined || 'N/A'}</div></div>
            <div class="detail-item"><div class="label">Last Contact</div><div class="value">${record.last_contact || 'N/A'}</div></div>
        </div>

        <div class="detail-item" style="margin-top: 20px;">
            <div class="label">Documents</div>
            <div style="display: flex; flex-wrap: wrap; gap: 10px; margin-top: 10px;">${documentsHTML}</div>
        </div>

        <div class="detail-item" style="margin-top: 20px;">
            <div class="label">Notes</div>
            <p class="value" style="line-height: 1.6;">${record.notes || 'No notes available.'}</p>
        </div>
    `;

    modal.classList.add('show');

    const downloadBtn = document.getElementById('downloadProfileBtn');
    downloadBtn.onclick = () => downloadProfileAsPDF(record);
}

function downloadProfileAsPDF(record) {
    if (!record) {
        showToast('User not found.', 'error');
        return;
    }
    const fullName = `${record.first_name || ''} ${record.last_name || ''}`.trim();

    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        doc.setFontSize(22);
        doc.setFont('helvetica', 'bold');
        doc.text('User Profile', 105, 20, { align: 'center' });

        if (record.profile_pic_url && record.profile_pic_url.startsWith('data:image')) {
            try {
                doc.addImage(record.profile_pic_url, 'JPEG', 20, 30, 40, 40);
            } catch (e) {
                console.error("Could not add image to PDF:", e);
            }
        }

        doc.setFontSize(18); doc.setFont('helvetica', 'bold'); doc.setTextColor(0, 0, 0);
        doc.text(fullName, 70, 45);
        doc.setFontSize(12); doc.setFont('helvetica', 'normal'); doc.setTextColor(100, 100, 100);
        doc.text(record.role || 'No role specified', 70, 52);
        doc.text(`ID: ${record.id} | Status: ${record.status.toUpperCase()}`, 70, 59);

        const profileData = [
            ['Email', record.email],
            ['Phone', record.phone || 'N/A'],
            ['Company', record.company || 'N/A'],
            ['Assigned To', record.assigned_to || 'N/A'],
            ['Joined Date', record.joined],
            ['Last Contact', record.last_contact]
        ];
        doc.autoTable({ startY: 80, head: [['Field', 'Value']], body: profileData, theme: 'grid', headStyles: { fillColor: [99, 102, 241] } });

        let finalY = doc.lastAutoTable.finalY + 15;
        doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.text('Notes', 20, finalY);
        doc.setFontSize(11); doc.setFont('helvetica', 'normal');
        const notes = doc.splitTextToSize(record.notes || 'No notes available.', 170);
        doc.text(notes, 20, finalY + 7);

        doc.save(`profile_${fullName.replace(/ /g, '_')}_${record.id}.pdf`);
        showToast('Profile PDF generated!', 'success');

    } catch (e) {
        showToast('Failed to generate PDF.', 'error');
        console.error("PDF Generation Error:", e);
    }
}

function renderAnalyticsCharts(data) {
    if (typeof Chart === 'undefined') return;

    if (userStatusChart) userStatusChart.destroy();
    if (userGrowthChart) userGrowthChart.destroy();

    const statusCtx = document.getElementById('userStatusChart').getContext('2d');
    const statusCounts = data.reduce((acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1;
        return acc;
    }, {});

    userStatusChart = new Chart(statusCtx, {
        type: 'doughnut',
        plugins: [ChartDataLabels],
        data: {
            labels: ['Active', 'Inactive', 'Pending', 'New', 'Contacted'],
            datasets: [{
                label: 'User Status',
                data: [statusCounts.active || 0, statusCounts.inactive || 0, statusCounts.pending || 0, statusCounts.new || 0, statusCounts.contacted || 0],
                backgroundColor: ['rgba(16, 185, 129, 0.7)', 'rgba(239, 68, 68, 0.7)', 'rgba(245, 158, 11, 0.7)', 'rgba(59, 130, 246, 0.7)', 'rgba(139, 92, 246, 0.7)'],
                borderColor: ['#10b981', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6'],
                borderWidth: 2,
                hoverOffset: 4
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: { position: 'top', labels: { color: '#e4e4e7' } },
                datalabels: {
                    formatter: (value, ctx) => {
                        const sum = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                        if (value === 0) return '';
                        const percentage = (value * 100 / sum).toFixed(1) + '%';
                        return percentage;
                    },
                    color: '#fff',
                    font: { weight: 'bold', size: 14 }
                }
            }
        }
    });

    const growthCtx = document.getElementById('userGrowthChart').getContext('2d');
    const months = Array.from({ length: 12 }, (_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        return d.toLocaleString('default', { month: 'short', year: '2-digit' });
    }).reverse();

    const userCountsByMonth = months.reduce((acc, month) => ({ ...acc, [month]: 0 }), {});
    data.forEach(user => {
        if (user.joined) {
            const joinDate = new Date(user.joined);
            const monthYear = joinDate.toLocaleString('default', { month: 'short', year: '2-digit' });
            if (userCountsByMonth.hasOwnProperty(monthYear)) {
                userCountsByMonth[monthYear]++;
            }
        }
    });

    userGrowthChart = new Chart(growthCtx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'New Users',
                data: Object.values(userCountsByMonth),
                fill: true,
                backgroundColor: 'rgba(99, 102, 241, 0.2)',
                borderColor: '#6366f1',
                tension: 0.4
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: { beginAtZero: true, ticks: { color: '#9ca3af', stepSize: 1 }, grid: { color: 'rgba(255, 255, 255, 0.1)' } },
                x: { ticks: { color: '#9ca3af' }, grid: { display: false } }
            },
            plugins: { legend: { display: false }, datalabels: { display: false } }
        }
    });
}

function renderAnalyticsInsights(data) {
    const insightsContent = document.getElementById('insightsContent');
    if (data.length === 0) {
        insightsContent.innerHTML = '<p>No data available to generate insights.</p>';
        return;
    }

    const statusCounts = data.reduce((acc, user) => {
        acc[user.status] = (acc[user.status] || 0) + 1;
        return acc;
    }, {});
    const mostCommonStatus = Object.keys(statusCounts).reduce((a, b) => statusCounts[a] > statusCounts[b] ? a : b, 'N/A');
    const mostCommonStatusCount = statusCounts[mostCommonStatus] || 0;
    const totalUsers = data.length;
    const mostCommonStatusPercentage = totalUsers > 0 ? ((mostCommonStatusCount / totalUsers) * 100).toFixed(1) : 0;

    const userCountsByMonth = {};
    data.forEach(user => {
        if (user.joined) {
            const monthYear = new Date(user.joined).toLocaleString('default', { month: 'long', year: 'numeric' });
            userCountsByMonth[monthYear] = (userCountsByMonth[monthYear] || 0) + 1;
        }
    });
    const peakMonth = Object.keys(userCountsByMonth).reduce((a, b) => userCountsByMonth[a] > userCountsByMonth[b] ? a : b, null);

    insightsContent.innerHTML = `
        <p>• The most common user status is <strong>${mostCommonStatus.toUpperCase()}</strong>, representing <strong>${mostCommonStatusPercentage}%</strong> of all records.</p>
        <p>• The highest user acquisition was observed in <strong>${peakMonth || 'N/A'}</strong>.</p>
    `;
}

function createBgDots() {
    const container = document.getElementById('bgAnimation');
    if (container.childElementCount > 2) return;
    for (let i = 0; i < 50; i++) {
        const dot = document.createElement('div');
        dot.className = 'floating-dot';
        dot.style.left = `${Math.random() * 100}%`;
        dot.style.animationDelay = `${Math.random() * 20}s`;
        dot.style.animationDuration = `${15 + Math.random() * 10}s`;
        container.appendChild(dot);
    }
}

function typeEffect(element, text, speed) {
    let i = 0;
    element.innerHTML = "";
    const cursor = document.createElement('span');
    cursor.style.cssText = 'display: inline-block; width: 8px; height: 1.2rem; background-color: #8b5cf6; animation: blink 1s step-end infinite; vertical-align: middle;';
    element.appendChild(cursor);

    function type() {
        if (i < text.length) {
            element.insertBefore(document.createTextNode(text.charAt(i)), cursor);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}
