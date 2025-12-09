const fs = require('fs');
const path = require('path');

class JsonDB {
    constructor(filename) {
        this.filePath = path.join(__dirname, '../data', `${filename}.json`);
        this.init();
    }

    init() {
        if (!fs.existsSync(this.filePath)) {
            fs.writeFileSync(this.filePath, JSON.stringify([]));
        }
    }

    read() {
        try {
            const data = fs.readFileSync(this.filePath, 'utf8');
            return JSON.parse(data);
        } catch (err) {
            return [];
        }
    }

    write(data) {
        fs.writeFileSync(this.filePath, JSON.stringify(data, null, 2));
    }

    find(query = {}) {
        const data = this.read();
        if (Object.keys(query).length === 0) return data;

        return data.filter(item => {
            return Object.keys(query).every(key => {
                // Handle basic mongo-like queries ($in, $lt, etc if needed, but keeping simple first)
                // Just exact match for now
                if (query[key] && typeof query[key] === 'object') {
                    // Very basic date logic support for booking checks
                    if (query[key].$lt) {
                        return new Date(item[key]) < new Date(query[key].$lt);
                    }
                    if (query[key].$gt) {
                        return new Date(item[key]) > new Date(query[key].$gt);
                    }
                    return item[key] == query[key]; // Fallback
                }
                return item[key] === query[key];
            });
        });
    }

    findOne(query) {
        const items = this.find(query);
        return items.length > 0 ? items[0] : null;
    }

    findById(id) {
        return this.findOne({ _id: id });
    }

    create(item) {
        const data = this.read();
        const newItem = {
            _id: Date.now().toString(), // Simple string ID
            ...item,
            createdAt: new Date().toISOString()
        };
        data.push(newItem);
        this.write(data);
        return newItem;
    }

    update(id, updates) {
        const data = this.read();
        const index = data.findIndex(i => i._id === id);
        if (index === -1) return null;

        data[index] = { ...data[index], ...updates };
        this.write(data);
        return data[index];
    }

    delete(id) {
        const data = this.read();
        const filtered = data.filter(i => i._id !== id);
        if (data.length === filtered.length) return false;
        this.write(filtered);
        return true;
    }

    // Helper to simulate "populate" since we don't have MongoDB's populate
    // We will do manual lookups in controllers if needed, or just return IDs.
}

module.exports = JsonDB;
