// models/CommonModel.js
import db from "../config/knex.js";

const CommonModel = {

  /* ===============================
     GENERIC SELECT
  =============================== */
  async getData(
    table,
    select = "*",
    condition = "",
    orderBy = "",
    order = "",
    groupBy = "",
    having = "",
    trx = null
  ) {
    const connection = trx || db;

    let query = connection(table).select(connection.raw(select));

    if (condition) query.whereRaw(condition);
    if (groupBy) query.groupByRaw(groupBy);
    if (having) query.havingRaw(having);
    if (orderBy && order) query.orderBy(orderBy, order);

    const result = await query;
    return result.length ? result : false;
  },

  /* ===============================
     SELECT WITH LIMIT & OFFSET
  =============================== */
  async getDataLimit(
    table,
    select = "*",
    condition = "",
    orderBy = "",
    order = "",
    limit = 0,
    offset = 0,
    trx = null
  ) {
    const connection = trx || db;

    let query = connection(table).select(connection.raw(select));

    if (condition) query.whereRaw(condition);
    if (orderBy && order) query.orderBy(orderBy, order);
    if (limit) query.limit(limit).offset(offset || 0);

    return await query;
  },

  /* ===============================
     JOIN FETCH
  =============================== */
  async joinFetch(
    mainTable,
    joinTables = [],
    condition = "1=1",
    sortBy = {},
    groupBy = "",
    limit = {},
    trx = null
  ) {
    const connection = trx || db;
    const [table, columnsArr] = mainTable;

    const selectCols =
      Array.isArray(columnsArr) && columnsArr.length
        ? columnsArr.join(", ")
        : "*";

    let query = connection
      .select(connection.raw(selectCols))
      .from(table);

    joinTables.forEach(([joinType, joinTable, joinOn, joinColumns]) => {
      query.joinRaw(`${joinType} JOIN ${joinTable} ON (${joinOn})`);
      if (joinColumns) {
        joinColumns.forEach(col =>
          query.select(connection.raw(col))
        );
      }
    });

    query.whereRaw(condition);

    if (groupBy) query.groupByRaw(groupBy);

    if (sortBy && typeof sortBy === "object") {
      Object.entries(sortBy).forEach(([key, value]) => {
        query.orderBy(key, value);
      });
    }

    if (limit.offset != null && limit.rows != null) {
      query.offset(limit.offset).limit(limit.rows);
    }

    return await query;
  },

  /* ===============================
     INSERT
  =============================== */
  async insertData(table, data, trx = null) {
    const connection = trx || db;

    try {
      const res = await connection(table).insert(data);
      return Array.isArray(res) ? res[0] : res;
    } catch (err) {
      throw err;
    }
  },

  /* ===============================
     UPDATE
  =============================== */
  async updateData(table, data, condition, trx = null) {
    const connection = trx || db;
    const updated = await connection(table)
      .whereRaw(condition)
      .update(data);
    return updated > 0;
  },

  /* ===============================
     DELETE
  =============================== */
  async deleteRecord(table, condition, trx = null) {
    const connection = trx || db;
    const deleted = await connection(table)
      .whereRaw(condition)
      .del();
    return deleted > 0;
  },

  /* ===============================
     ENUM FETCH (MYSQL)
  =============================== */
  async getEnum(table, field) {
    const result = await db.raw(
      `SHOW COLUMNS FROM \`${table}\` LIKE '${field}'`
    );

    const rowType = result[0][0].Type;
    const matches = rowType.match(/'([^']+)'/g);

    return matches ? matches.map(v => v.replace(/'/g, "")) : [];
  }
};

export default CommonModel;
