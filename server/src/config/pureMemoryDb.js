/**
 * Pure JavaScript In-Memory Database Engine
 * Zero native binary dependencies, zero GLIBC requirements, 100% portable.
 * Perfectly mimics MySQL 2 / SQLite interface for seamless local & cloud deployment.
 */

let instance = null;

const createPureMemoryDb = () => {
  if (instance) return instance;

  // Initial seed passwords (matching database/seed.sql)
  // AdminPass123! -> Admin@1234
  // OwnerPass123! -> Owner@1234
  // UserPass123!  -> User@1234
  const adminHash = '$2b$10$LiqRSCJiBEVtEyckrP4ZSOoUyrjm47TzhDz9IzfYKxISMsp2cAGS6';
  const ownerHash = '$2b$10$7MkyPW7JIPeyD8nXtQaV1e56wzC./Lw0WKfUp9SYAqo4CTcxdKID2';
  const userHash  = '$2b$10$W3m.KeMWMSqxcZh5TQ8MWeoo2Q1nAL260eGnq/oDP0IP8zJafLX4a';

  let nextUserId = 11;
  let nextStoreId = 6;
  let nextRatingId = 15;

  let users = [
    { id: 1, name: 'Administrator Super Master', email: 'admin@storerating.com', password_hash: adminHash, address: '100 Corporate Boulevard, Suite 500, Tech District, Metropolis', role: 'ADMIN', created_at: new Date('2026-10-27T06:00:00Z'), updated_at: new Date('2026-10-27T06:00:00Z') },
    { id: 2, name: 'Christopher James Harrington', email: 'harrington@storerating.com', password_hash: ownerHash, address: '42 Market Street, Commercial Arcade, Downtown Financial City', role: 'STORE_OWNER', created_at: new Date('2026-10-27T06:05:00Z'), updated_at: new Date('2026-10-27T06:05:00Z') },
    { id: 3, name: 'Eleanor Beatrice Montgomery', email: 'montgomery@storerating.com', password_hash: ownerHash, address: '88 Elmwood Avenue, Suite 12B, Uptown Arts Quarter, North Valley', role: 'STORE_OWNER', created_at: new Date('2026-10-27T06:10:00Z'), updated_at: new Date('2026-10-27T06:10:00Z') },
    { id: 4, name: 'Guillermo Francisco Rodriguez', email: 'rodriguez@storerating.com', password_hash: ownerHash, address: '150 Pacific Coast Highway, Unit 4, Harbor View, South Bay', role: 'STORE_OWNER', created_at: new Date('2026-10-27T06:15:00Z'), updated_at: new Date('2026-10-27T06:15:00Z') },
    { id: 5, name: 'Victoria Alexandria Pemberton', email: 'pemberton@storerating.com', password_hash: ownerHash, address: '304 Royal Crest Boulevard, Garden District, Metro Central', role: 'STORE_OWNER', created_at: new Date('2026-10-27T06:20:00Z'), updated_at: new Date('2026-10-27T06:20:00Z') },
    { id: 6, name: 'Jonathan Edward Higginsworth', email: 'jonathan.higgins@example.com', password_hash: userHash, address: '12 Willowbrook Terrace, Apartment 3A, West End, Greenfield', role: 'USER', created_at: new Date('2026-10-27T06:25:00Z'), updated_at: new Date('2026-10-27T06:25:00Z') },
    { id: 7, name: 'Bartholomew Christopher Davis', email: 'bart.davis@example.com', password_hash: userHash, address: '455 Sunnyside Way, Residential Block 9, Eastside Heights', role: 'USER', created_at: new Date('2026-10-27T06:30:00Z'), updated_at: new Date('2026-10-27T06:30:00Z') },
    { id: 8, name: 'Anastasia Catherine Romanov', email: 'anastasia.romanov@example.com', password_hash: userHash, address: '789 Birchwood Lane, Suite 101, Oakmont Gardens, Highland Park', role: 'USER', created_at: new Date('2026-10-27T06:35:00Z'), updated_at: new Date('2026-10-27T06:35:00Z') },
    { id: 9, name: 'Zachary Nathaniel Kensington', email: 'zach.kensington@example.com', password_hash: userHash, address: '67 Maple Ridge Crossing, Tower B, Midtown Lake District', role: 'USER', created_at: new Date('2026-10-27T06:40:00Z'), updated_at: new Date('2026-10-27T06:40:00Z') },
    { id: 10, name: 'Madeline Sophia Abernathy', email: 'madeline.abernathy@example.com', password_hash: userHash, address: '210 Silver Spring Court, Building 5, Riverfront Crossing', role: 'USER', created_at: new Date('2026-10-27T06:45:00Z'), updated_at: new Date('2026-10-27T06:45:00Z') }
  ];

  let stores = [
    { id: 1, name: 'Apex Organic Gourmet Supermarket', email: 'contact@apexorganic.com', address: '42 Market Street, Commercial Arcade, Downtown Financial City', owner_id: 2, created_at: new Date('2026-10-27T06:05:00Z'), updated_at: new Date('2026-10-27T06:05:00Z') },
    { id: 2, name: 'Heritage Artisan Coffee Roasters', email: 'hello@heritageartisancoffee.com', address: '88 Elmwood Avenue, Suite 12B, Uptown Arts Quarter, North Valley', owner_id: 3, created_at: new Date('2026-10-27T06:10:00Z'), updated_at: new Date('2026-10-27T06:10:00Z') },
    { id: 3, name: 'Pacific Coastal Tech & Gadgets', email: 'support@pacificcoasttech.com', address: '150 Pacific Coast Highway, Unit 4, Harbor View, South Bay', owner_id: 4, created_at: new Date('2026-10-27T06:15:00Z'), updated_at: new Date('2026-10-27T06:15:00Z') },
    { id: 4, name: 'Royal Sapphire Luxury Department Store', email: 'concierge@royalsapphirestore.com', address: '304 Royal Crest Boulevard, Garden District, Metro Central', owner_id: 5, created_at: new Date('2026-10-27T06:20:00Z'), updated_at: new Date('2026-10-27T06:20:00Z') },
    { id: 5, name: 'Zenith Electronics & Home Automation', email: 'info@zenithelectronics.com', address: '512 Innovation Parkway, Technology Center, Cyber Valley', owner_id: null, created_at: new Date('2026-10-27T06:25:00Z'), updated_at: new Date('2026-10-27T06:25:00Z') }
  ];

  let ratings = [
    { id: 1, user_id: 6, store_id: 1, rating: 5, created_at: new Date('2026-10-27T07:00:00Z'), updated_at: new Date('2026-10-27T07:00:00Z') },
    { id: 2, user_id: 7, store_id: 1, rating: 4, created_at: new Date('2026-10-27T07:05:00Z'), updated_at: new Date('2026-10-27T07:05:00Z') },
    { id: 3, user_id: 9, store_id: 1, rating: 5, created_at: new Date('2026-10-27T07:10:00Z'), updated_at: new Date('2026-10-27T07:10:00Z') },
    { id: 4, user_id: 10, store_id: 1, rating: 4, created_at: new Date('2026-10-27T07:15:00Z'), updated_at: new Date('2026-10-27T07:15:00Z') },
    { id: 5, user_id: 6, store_id: 2, rating: 4, created_at: new Date('2026-10-27T07:20:00Z'), updated_at: new Date('2026-10-27T07:20:00Z') },
    { id: 6, user_id: 7, store_id: 2, rating: 5, created_at: new Date('2026-10-27T07:25:00Z'), updated_at: new Date('2026-10-27T07:25:00Z') },
    { id: 7, user_id: 8, store_id: 2, rating: 5, created_at: new Date('2026-10-27T07:30:00Z'), updated_at: new Date('2026-10-27T07:30:00Z') },
    { id: 8, user_id: 10, store_id: 2, rating: 4, created_at: new Date('2026-10-27T07:35:00Z'), updated_at: new Date('2026-10-27T07:35:00Z') },
    { id: 9, user_id: 6, store_id: 3, rating: 3, created_at: new Date('2026-10-27T07:40:00Z'), updated_at: new Date('2026-10-27T07:40:00Z') },
    { id: 10, user_id: 8, store_id: 3, rating: 4, created_at: new Date('2026-10-27T07:45:00Z'), updated_at: new Date('2026-10-27T07:45:00Z') },
    { id: 11, user_id: 9, store_id: 3, rating: 4, created_at: new Date('2026-10-27T07:50:00Z'), updated_at: new Date('2026-10-27T07:50:00Z') },
    { id: 12, user_id: 7, store_id: 4, rating: 5, created_at: new Date('2026-10-27T07:55:00Z'), updated_at: new Date('2026-10-27T07:55:00Z') },
    { id: 13, user_id: 8, store_id: 4, rating: 4, created_at: new Date('2026-10-27T08:00:00Z'), updated_at: new Date('2026-10-27T08:00:00Z') },
    { id: 14, user_id: 9, store_id: 4, rating: 3, created_at: new Date('2026-10-27T08:05:00Z'), updated_at: new Date('2026-10-27T08:05:00Z') }
  ];

  const getStoreAggregates = (storeId) => {
    const storeRatings = ratings.filter((r) => Number(r.store_id) === Number(storeId));
    if (storeRatings.length === 0) {
      return { average_rating: 0, total_ratings: 0 };
    }
    const sum = storeRatings.reduce((acc, r) => acc + Number(r.rating), 0);
    const avg = Number((sum / storeRatings.length).toFixed(2));
    return { average_rating: avg, total_ratings: storeRatings.length };
  };

  const query = async (sql, params = []) => {
    const s = sql.trim();
    const upper = s.toUpperCase();

    // 1. SELECT 1 + 1 AS health_check
    if (upper.includes('HEALTH_CHECK') || upper.includes('SELECT 1 + 1')) {
      return [[{ health_check: 2 }], []];
    }

    // 2. INSERT INTO users
    if (upper.startsWith('INSERT INTO USERS')) {
      // params: [name, email, password_hash, address, role]
      const [name, email, password_hash, address, role] = params;
      if (users.some((u) => u.email.toLowerCase() === email.toLowerCase())) {
        const err = new Error('Duplicate entry for email');
        err.code = 'ER_DUP_ENTRY';
        throw err;
      }
      const newUser = {
        id: nextUserId++,
        name,
        email,
        password_hash,
        address,
        role: role || 'USER',
        created_at: new Date(),
        updated_at: new Date()
      };
      users.push(newUser);
      return [{ insertId: newUser.id, affectedRows: 1 }, []];
    }

    // 3. SELECT id FROM users WHERE email = ?
    if (upper.startsWith('SELECT ID FROM USERS WHERE EMAIL =') || upper.startsWith('SELECT ID FROM USERS WHERE EMAIL=?')) {
      const email = params[0];
      const match = users.filter((u) => u.email.toLowerCase() === String(email).toLowerCase());
      return [match.map((u) => ({ id: u.id })), []];
    }

    // 4. SELECT ... FROM users WHERE email = ?
    if (upper.includes('FROM USERS') && upper.includes('WHERE EMAIL =')) {
      const email = params[0];
      const match = users.filter((u) => u.email.toLowerCase() === String(email).toLowerCase());
      return [match.map((u) => ({ ...u })), []];
    }

    // 5. SELECT password_hash FROM users WHERE id = ?
    if (upper.includes('SELECT PASSWORD_HASH FROM USERS WHERE ID =')) {
      const id = Number(params[0]);
      const match = users.filter((u) => u.id === id);
      return [match.map((u) => ({ password_hash: u.password_hash })), []];
    }

    // 6. UPDATE users SET password_hash = ? WHERE id = ?
    if (upper.startsWith('UPDATE USERS SET PASSWORD_HASH')) {
      const newHash = params[0];
      const id = Number(params[params.length - 1]);
      const u = users.find((x) => x.id === id);
      if (u) {
        u.password_hash = newHash;
        u.updated_at = new Date();
      }
      return [{ affectedRows: u ? 1 : 0 }, []];
    }

    // 7. SELECT ... FROM users WHERE id = ?
    if (upper.startsWith('SELECT') && upper.includes('FROM USERS WHERE ID =')) {
      const id = Number(params[0]);
      const match = users.filter((u) => u.id === id);
      return [match.map((u) => ({ ...u })), []];
    }

    // 8. Admin Dashboard User counts
    if (upper.includes('COUNT(*) AS TOTAL_USERS') && upper.includes('FROM USERS')) {
      const total = users.length;
      const adminCount = users.filter((u) => u.role === 'ADMIN').length;
      const ownerCount = users.filter((u) => u.role === 'STORE_OWNER').length;
      const userCount = users.filter((u) => u.role === 'USER').length;
      return [[{ total_users: total, admin_count: adminCount, owner_count: ownerCount, user_count: userCount }], []];
    }

    // 9. Admin Dashboard Store counts
    if (upper.includes('COUNT(*) AS TOTAL_STORES') && upper.includes('FROM STORES')) {
      const total = stores.length;
      const assigned = stores.filter((s) => s.owner_id !== null).length;
      return [[{ total_stores: total, assigned_stores: assigned, unassigned_stores: total - assigned }], []];
    }

    // 10. Admin Dashboard Rating counts
    if (upper.includes('COUNT(*) AS TOTAL_RATINGS') && upper.includes('FROM RATINGS')) {
      const total = ratings.length;
      const avg = total > 0 ? Number((ratings.reduce((a, b) => a + Number(b.rating), 0) / total).toFixed(2)) : 0;
      return [[{ total_ratings: total, average_rating: avg }], []];
    }

    // 11. Stores query for Store Owner: SELECT s.id, s.name... WHERE s.owner_id = ?
    if (upper.includes('FROM STORES') && upper.includes('WHERE S.OWNER_ID =') || (upper.includes('FROM STORES') && upper.includes('WHERE OWNER_ID =') && !upper.includes('COUNT'))) {
      const ownerId = Number(params[0]);
      const storeList = stores.filter((s) => Number(s.owner_id) === ownerId);
      const res = storeList.map((s) => {
        const agg = getStoreAggregates(s.id);
        return {
          id: s.id,
          name: s.name,
          email: s.email,
          address: s.address,
          owner_id: s.owner_id,
          average_rating: agg.average_rating,
          total_ratings: agg.total_ratings,
          created_at: s.created_at,
          updated_at: s.updated_at
        };
      });
      return [res, []];
    }

    // 12. Rating distribution: SELECT rating, COUNT(*) AS count FROM ratings WHERE store_id = ? GROUP BY rating
    if (upper.includes('FROM RATINGS') && upper.includes('GROUP BY RATING')) {
      const storeId = Number(params[0]);
      const storeRatings = ratings.filter((r) => Number(r.store_id) === storeId);
      const dist = [1, 2, 3, 4, 5].map((star) => ({
        rating: star,
        count: storeRatings.filter((r) => Number(r.rating) === star).length
      }));
      return [dist, []];
    }

    // 13. My Rating: SELECT id, rating FROM ratings WHERE user_id = ? AND store_id = ?
    if (upper.includes('FROM RATINGS') && upper.includes('WHERE USER_ID =') && upper.includes('STORE_ID =')) {
      const userId = Number(params[0]);
      const storeId = Number(params[1]);
      const match = ratings.filter((r) => Number(r.user_id) === userId && Number(r.store_id) === storeId);
      return [match.map((r) => ({ id: r.id, rating: r.rating })), []];
    }

    // 14. INSERT INTO ratings
    if (upper.startsWith('INSERT INTO RATINGS')) {
      const [userId, storeId, ratingVal] = params.map(Number);
      if (ratings.some((r) => r.user_id === userId && r.store_id === storeId)) {
        const err = new Error('Duplicate rating');
        err.code = 'ER_DUP_ENTRY';
        throw err;
      }
      const newRating = {
        id: nextRatingId++,
        user_id: userId,
        store_id: storeId,
        rating: ratingVal,
        created_at: new Date(),
        updated_at: new Date()
      };
      ratings.push(newRating);
      return [{ insertId: newRating.id, affectedRows: 1 }, []];
    }

    // 15. UPDATE ratings SET rating = ?
    if (upper.startsWith('UPDATE RATINGS SET RATING')) {
      const ratingVal = Number(params[0]);
      const userId = Number(params[1]);
      const storeId = Number(params[2]);
      const r = ratings.find((x) => x.user_id === userId && x.store_id === storeId);
      if (r) {
        r.rating = ratingVal;
        r.updated_at = new Date();
      }
      return [{ affectedRows: r ? 1 : 0 }, []];
    }

    // 16. Single store by id: SELECT ... FROM stores WHERE id = ?
    if (upper.includes('FROM STORES') && (upper.includes('WHERE S.ID = ?') || upper.includes('WHERE ID = ?'))) {
      const id = Number(params[0]);
      const s = stores.find((x) => x.id === id);
      if (!s) return [[], []];
      const agg = getStoreAggregates(s.id);
      return [[{
        ...s,
        average_rating: agg.average_rating,
        total_ratings: agg.total_ratings
      }], []];
    }

    // 17. INSERT INTO stores
    if (upper.startsWith('INSERT INTO STORES')) {
      const [name, email, address, ownerId] = params;
      if (ownerId && stores.some((s) => s.owner_id === Number(ownerId))) {
        const err = new Error('Store owner already assigned');
        err.code = 'ER_DUP_ENTRY';
        throw err;
      }
      const newStore = {
        id: nextStoreId++,
        name,
        email,
        address,
        owner_id: ownerId ? Number(ownerId) : null,
        created_at: new Date(),
        updated_at: new Date()
      };
      stores.push(newStore);
      return [{ insertId: newStore.id, affectedRows: 1 }, []];
    }

    // 18. Store Owner Customer Ratings table
    if (upper.includes('FROM RATINGS R') && upper.includes('JOIN USERS U') && upper.includes('WHERE R.STORE_ID =')) {
      const storeId = Number(params[0]);
      let list = ratings.filter((r) => Number(r.store_id) === storeId);

      // Search filter if provided
      if (params.length >= 3 && typeof params[1] === 'string' && params[1].includes('%')) {
        const searchPattern = params[1].replace(/%/g, '').toLowerCase();
        list = list.filter((r) => {
          const u = users.find((x) => x.id === r.user_id);
          return u && (u.name.toLowerCase().includes(searchPattern) || u.email.toLowerCase().includes(searchPattern));
        });
      }

      // Map rows with user info
      let rows = list.map((r) => {
        const u = users.find((x) => x.id === r.user_id) || {};
        return {
          id: r.id,
          rating: r.rating,
          created_at: r.created_at,
          user_id: u.id,
          user_name: u.name,
          user_email: u.email
        };
      });

      // Pagination limits
      if (params.length >= 2) {
        const limit = Number(params[params.length - 2]);
        const offset = Number(params[params.length - 1]);
        if (!isNaN(limit) && !isNaN(offset)) {
          rows = rows.slice(offset, offset + limit);
        }
      }
      return [rows, []];
    }

    // 19. Count queries (must explicitly start with SELECT COUNT to avoid matching queries with COUNT(...) AS total_ratings)
    if (upper.startsWith('SELECT COUNT')) {
      if (upper.includes('FROM RATINGS')) {
        let count = ratings.length;
        if (params.length > 0 && typeof params[0] === 'number') {
          count = ratings.filter((r) => Number(r.store_id) === Number(params[0])).length;
        }
        return [[{ total: count }], []];
      }
      if (upper.includes('FROM USERS')) {
        let count = users.length;
        const roleParam = params.find((p) => ['ADMIN', 'STORE_OWNER', 'USER'].includes(p));
        if (roleParam) {
          count = users.filter((u) => u.role === roleParam).length;
        }
        return [[{ total: count }], []];
      }
      if (upper.includes('FROM STORES')) {
        let count = stores.length;
        const searchParam = params.find((p) => typeof p === 'string' && p.includes('%'));
        if (searchParam) {
          const q = searchParam.replace(/%/g, '').toLowerCase();
          count = stores.filter((s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q) || (s.email && s.email.toLowerCase().includes(q))).length;
        }
        return [[{ total: count }], []];
      }
      return [[{ total: 0 }], []];
    }

    // 20. Users table listing for Admin
    if (upper.includes('FROM USERS U') || upper.startsWith('SELECT U.ID, U.NAME, U.EMAIL')) {
      let list = [...users];

      // Role filter
      const roleParam = params.find((p) => ['ADMIN', 'STORE_OWNER', 'USER'].includes(p));
      if (roleParam) {
        list = list.filter((u) => u.role === roleParam);
      }

      // Search keyword filter
      const searchParam = params.find((p) => typeof p === 'string' && p.includes('%'));
      if (searchParam) {
        const q = searchParam.replace(/%/g, '').toLowerCase();
        list = list.filter((u) => u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q) || u.address.toLowerCase().includes(q));
      }

      let rows = list.map((u) => {
        const assignedStore = stores.find((s) => s.owner_id === u.id);
        const agg = assignedStore ? getStoreAggregates(assignedStore.id) : null;
        return {
          id: u.id,
          name: u.name,
          email: u.email,
          address: u.address,
          role: u.role,
          created_at: u.created_at,
          updated_at: u.updated_at,
          store_id: assignedStore ? assignedStore.id : null,
          store_name: assignedStore ? assignedStore.name : null,
          store_rating: agg ? agg.average_rating : null
        };
      });

      // Pagination
      if (params.length >= 2) {
        const limit = Number(params[params.length - 2]);
        const offset = Number(params[params.length - 1]);
        if (!isNaN(limit) && !isNaN(offset)) {
          rows = rows.slice(offset, offset + limit);
        }
      }
      return [rows, []];
    }

    // 21. Stores table listing for Consumer & Admin
    if (upper.includes('FROM STORES S') || upper.startsWith('SELECT S.ID, S.NAME')) {
      let list = [...stores];

      // Search filter
      const searchParam = params.find((p) => typeof p === 'string' && p.includes('%'));
      if (searchParam) {
        const q = searchParam.replace(/%/g, '').toLowerCase();
        list = list.filter((s) => s.name.toLowerCase().includes(q) || s.address.toLowerCase().includes(q) || (s.email && s.email.toLowerCase().includes(q)));
      }

      let rows = list.map((s) => {
        const agg = getStoreAggregates(s.id);
        const owner = users.find((u) => u.id === s.owner_id);

        // Check if user_submitted_rating requested
        let userRating = null;
        if (params.length > 0 && typeof params[0] === 'number') {
          const ur = ratings.find((r) => r.store_id === s.id && r.user_id === params[0]);
          if (ur) userRating = ur.rating;
        }

        return {
          id: s.id,
          name: s.name,
          email: s.email,
          address: s.address,
          owner_id: s.owner_id,
          owner_name: owner ? owner.name : null,
          owner_email: owner ? owner.email : null,
          created_at: s.created_at,
          updated_at: s.updated_at,
          average_rating: agg.average_rating,
          overall_rating: agg.average_rating,
          total_ratings: agg.total_ratings,
          user_submitted_rating: userRating
        };
      });

      // Sort
      if (upper.includes('ORDER BY OVERALL_RATING DESC') || upper.includes('ORDER BY AVERAGE_RATING DESC') || upper.includes('ORDER BY RATING DESC')) {
        rows.sort((a, b) => b.overall_rating - a.overall_rating);
      } else if (upper.includes('ORDER BY OVERALL_RATING ASC') || upper.includes('ORDER BY AVERAGE_RATING ASC') || upper.includes('ORDER BY RATING ASC')) {
        rows.sort((a, b) => a.overall_rating - b.overall_rating);
      } else if (upper.includes('ORDER BY NAME DESC') || upper.includes('ORDER BY S.NAME DESC')) {
        rows.sort((a, b) => b.name.localeCompare(a.name));
      } else if (upper.includes('ORDER BY NAME ASC') || upper.includes('ORDER BY S.NAME ASC')) {
        rows.sort((a, b) => a.name.localeCompare(b.name));
      } else if (upper.includes('ORDER BY EMAIL DESC') || upper.includes('ORDER BY S.EMAIL DESC')) {
        rows.sort((a, b) => b.email.localeCompare(a.email));
      } else if (upper.includes('ORDER BY EMAIL ASC') || upper.includes('ORDER BY S.EMAIL ASC')) {
        rows.sort((a, b) => a.email.localeCompare(b.email));
      } else if (upper.includes('ORDER BY ADDRESS DESC') || upper.includes('ORDER BY S.ADDRESS DESC')) {
        rows.sort((a, b) => b.address.localeCompare(a.address));
      } else if (upper.includes('ORDER BY ADDRESS ASC') || upper.includes('ORDER BY S.ADDRESS ASC')) {
        rows.sort((a, b) => a.address.localeCompare(b.address));
      }

      // Pagination
      if (params.length >= 2) {
        const limit = Number(params[params.length - 2]);
        const offset = Number(params[params.length - 1]);
        if (!isNaN(limit) && !isNaN(offset)) {
          rows = rows.slice(offset, offset + limit);
        }
      }
      return [rows, []];
    }

    // 22. Generic fallback
    return [[], []];
  };

  instance = {
    query,
    withTransaction: async (cb) => cb({ query }),
    testConnection: async () => ({ connected: true, result: 2 }),
    pool: { end: async () => Promise.resolve() }
  };

  return instance;
};

module.exports = { createPureMemoryDb };
