const bearerSecurity = [{ bearerAuth: [] }];

const errorResponse = {
  description: "Respons error",
  content: {
    "application/json": {
      schema: {
        type: "object",
        properties: {
          success: { type: "boolean", example: false },
          error: {
            type: "object",
            properties: {
              code: { type: "string" },
              message: { type: "string" },
              details: { type: "array", items: { type: "object" } },
            },
          },
        },
      },
    },
  },
};

function paginated(itemsRef) {
  return {
    description: "Daftar data terpaginasi",
    content: {
      "application/json": {
        schema: {
          type: "object",
          properties: {
            success: { type: "boolean", example: true },
            data: { type: "array", items: { $ref: itemsRef } },
            meta: {
              type: "object",
              properties: {
                page: { type: "integer" },
                limit: { type: "integer" },
                total: { type: "integer" },
                totalPages: { type: "integer" },
              },
            },
          },
        },
      },
    },
  };
}

function listParams(extra = []) {
  return [
    { name: "page", in: "query", schema: { type: "integer", default: 1 } },
    { name: "limit", in: "query", schema: { type: "integer", default: 20, maximum: 100 } },
    { name: "sort", in: "query", schema: { type: "string" } },
    { name: "order", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
    { name: "q", in: "query", schema: { type: "string" }, description: "Pencarian teks" },
    ...extra,
  ];
}

const idPathParams = [
  {
    name: "id",
    in: "path",
    required: true,
    schema: { type: "integer", format: "int64" },
  },
];

function crudPath(tag, summaryPrefix, schemaRef, extra = {}) {
  const secured = { security: bearerSecurity, responses: { 401: errorResponse, 403: errorResponse } };
  return {
    get: {
      tags: [tag],
      summary: `Daftar ${summaryPrefix}`,
      security: bearerSecurity,
      parameters: listParams(extra.listParams ?? []),
      responses: { 200: paginated(schemaRef), ...secured.responses },
    },
    post: {
      tags: [tag],
      summary: `Tambah ${summaryPrefix}`,
      security: bearerSecurity,
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: schemaRef } } },
      },
      responses: {
        201: { description: "Berhasil dibuat" },
        409: errorResponse,
        ...secured.responses,
        422: errorResponse,
      },
    },
  };
}

function itemPath(tag, summaryPrefix, schemaRef) {
  return {
    get: {
      tags: [tag],
      summary: `Detail ${summaryPrefix}`,
      security: bearerSecurity,
      parameters: idPathParams,
      responses: {
        200: { description: "OK" },
        404: errorResponse,
        ...{ 401: errorResponse, 403: errorResponse },
      },
    },
    patch: {
      tags: [tag],
      summary: `Perbarui ${summaryPrefix}`,
      security: bearerSecurity,
      parameters: idPathParams,
      requestBody: {
        required: true,
        content: { "application/json": { schema: { $ref: schemaRef } } },
      },
      responses: { 200: { description: "OK" }, 404: errorResponse, 409: errorResponse, 422: errorResponse },
    },
    delete: {
      tags: [tag],
      summary: `Hapus ${summaryPrefix}`,
      security: bearerSecurity,
      parameters: idPathParams,
      responses: { 200: { description: "Berhasil dihapus" }, 404: errorResponse, 409: errorResponse },
    },
  };
}

export const openApiSpec = {
  openapi: "3.0.3",
  info: {
    title: "SIM Mahasiswa UMB API",
    version: "1.0.0",
    description:
      "RESTful API SIM Mahasiswa berbasis Node.js, Express.js, dan PostgreSQL (Neon). Diimplementasikan dengan Prisma Client + driver adapter Neon.",
  },
  servers: [{ url: "/api/v1", description: "API v1" }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
      },
    },
    schemas: {
      Universitas: {
        type: "object",
        properties: {
          id: { type: "integer", format: "int64" },
          kodeUniversitas: { type: "string" },
          namaUniversitas: { type: "string" },
          slogan: { type: "string", nullable: true },
          alamat: { type: "string", nullable: true },
          kota: { type: "string", nullable: true },
          provinsi: { type: "string", nullable: true },
          kodePos: { type: "string", nullable: true },
          website: { type: "string", nullable: true },
          email: { type: "string", nullable: true },
          telepon: { type: "string", nullable: true },
          createdAt: { type: "string", format: "date-time" },
          updatedAt: { type: "string", format: "date-time" },
        },
      },
      Fakultas: {
        type: "object",
        properties: {
          id: { type: "integer", format: "int64" },
          idUniversitas: { type: "integer", format: "int64" },
          kodeFakultas: { type: "string" },
          namaFakultas: { type: "string" },
        },
      },
      ProgramStudi: {
        type: "object",
        properties: {
          id: { type: "integer", format: "int64" },
          idFakultas: { type: "integer", format: "int64" },
          kodeProgramStudi: { type: "string" },
          namaProgramStudi: { type: "string" },
          jenjang: { type: "string" },
          statusAktif: { type: "string", enum: ["Aktif", "Tidak Aktif"] },
        },
      },
      Role: {
        type: "object",
        properties: {
          id: { type: "integer" },
          kodeRole: { type: "string" },
          namaRole: { type: "string" },
          keterangan: { type: "string", nullable: true },
        },
      },
      Pengguna: {
        type: "object",
        properties: {
          id: { type: "integer", format: "int64" },
          idRole: { type: "integer" },
          username: { type: "string" },
          namaLengkap: { type: "string" },
          email: { type: "string", nullable: true },
          noHp: { type: "string", nullable: true },
          statusAktif: { type: "string", enum: ["Aktif", "Tidak Aktif"] },
        },
      },
      Mahasiswa: {
        type: "object",
        properties: {
          id: { type: "integer", format: "int64" },
          npm: { type: "string" },
          namaMahasiswa: { type: "string" },
          jenisKelamin: { type: "string", enum: ["L", "P"] },
          tempatLahir: { type: "string", nullable: true },
          tanggalLahir: { type: "string", format: "date", nullable: true },
          tanggalMasuk: { type: "string", format: "date" },
          alamat: { type: "string", nullable: true },
          statusMahasiswa: { type: "string" },
          fotoUrl: { type: "string", nullable: true },
        },
      },
      AuditLog: {
        type: "object",
        properties: {
          id: { type: "integer", format: "int64" },
          tabelNama: { type: "string" },
          recordId: { type: "string", nullable: true },
          aksi: { type: "string", enum: ["LOGIN", "LOGOUT", "INSERT", "UPDATE", "DELETE", "VIEW"] },
          waktu: { type: "string", format: "date-time" },
        },
      },
      LoginRequest: {
        type: "object",
        required: ["username", "password"],
        properties: {
          username: { type: "string" },
          password: { type: "string" },
        },
      },
    },
  },
  paths: {
    "/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login dan mendapatkan access + refresh token",
        security: [],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginRequest" } } },
        },
        responses: {
          200: { description: "Login berhasil" },
          401: errorResponse,
          422: errorResponse,
        },
      },
    },
    "/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Menukar refresh token dengan access token baru",
        security: [],
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: {
                type: "object",
                required: ["refreshToken"],
                properties: { refreshToken: { type: "string" } },
              },
            },
          },
        },
        responses: { 200: { description: "OK" }, 401: errorResponse },
      },
    },
    "/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Keluar dan mencatat audit LOGOUT",
        security: bearerSecurity,
        responses: { 200: { description: "OK" }, 401: errorResponse },
      },
    },
    "/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Profil pengguna yang sedang login",
        security: bearerSecurity,
        responses: { 200: { description: "OK" }, 401: errorResponse },
      },
    },
    "/auth/password": {
      put: {
        tags: ["Auth"],
        summary: "Ganti password",
        security: bearerSecurity,
        responses: { 200: { description: "OK" }, 400: errorResponse, 401: errorResponse },
      },
    },
    "/universitas": crudPath("Universitas", "universitas", "#/components/schemas/Universitas", {
      listParams: [{ name: "kota", in: "query", schema: { type: "string" } }],
    }),
    "/universitas/{id}": itemPath("Universitas", "universitas", "#/components/schemas/Universitas"),
    "/fakultas": crudPath("Fakultas", "fakultas", "#/components/schemas/Fakultas", {
      listParams: [{ name: "id_universitas", in: "query", schema: { type: "integer" } }],
    }),
    "/fakultas/{id}": itemPath("Fakultas", "fakultas", "#/components/schemas/Fakultas"),
    "/program-studi": crudPath("ProgramStudi", "program studi", "#/components/schemas/ProgramStudi", {
      listParams: [
        { name: "id_fakultas", in: "query", schema: { type: "integer" } },
        { name: "status_aktif", in: "query", schema: { type: "string" } },
        { name: "jenjang", in: "query", schema: { type: "string" } },
      ],
    }),
    "/program-studi/{id}": itemPath("ProgramStudi", "program studi", "#/components/schemas/ProgramStudi"),
    "/roles": crudPath("Roles", "role", "#/components/schemas/Role"),
    "/roles/{id}": itemPath("Roles", "role", "#/components/schemas/Role"),
    "/pengguna": crudPath("Pengguna", "pengguna", "#/components/schemas/Pengguna", {
      listParams: [
        { name: "id_role", in: "query", schema: { type: "integer" } },
        { name: "status_aktif", in: "query", schema: { type: "string" } },
      ],
    }),
    "/pengguna/{id}": itemPath("Pengguna", "pengguna", "#/components/schemas/Pengguna"),
    "/mahasiswa": {
      ...crudPath("Mahasiswa", "mahasiswa", "#/components/schemas/Mahasiswa", {
        listParams: [
          { name: "id_program_studi", in: "query", schema: { type: "integer" } },
          { name: "status_mahasiswa", in: "query", schema: { type: "string" } },
          { name: "jenis_kelamin", in: "query", schema: { type: "string", enum: ["L", "P"] } },
          { name: "jenjang", in: "query", schema: { type: "string" } },
        ],
      }),
    },
    "/mahasiswa/{id}": itemPath("Mahasiswa", "mahasiswa", "#/components/schemas/Mahasiswa"),
    "/mahasiswa/profil/{npm}": {
      get: {
        tags: ["Mahasiswa"],
        summary: "Profil mahasiswa berdasarkan NPM (view v_profil_mahasiswa)",
        security: bearerSecurity,
        parameters: [{ name: "npm", in: "path", required: true, schema: { type: "string" } }],
        responses: { 200: { description: "OK" }, 404: errorResponse },
      },
    },
    "/mahasiswa/{id}/foto": {
      post: {
        tags: ["Mahasiswa"],
        summary: "Upload foto mahasiswa (multipart/form-data)",
        security: bearerSecurity,
        parameters: idPathParams,
        requestBody: {
          required: true,
          content: {
            "multipart/form-data": {
              schema: {
                type: "object",
                required: ["foto"],
                properties: { foto: { type: "string", format: "binary" } },
              },
            },
          },
        },
        responses: { 200: { description: "OK" }, 400: errorResponse, 413: errorResponse },
      },
      delete: {
        tags: ["Mahasiswa"],
        summary: "Hapus foto mahasiswa",
        security: bearerSecurity,
        parameters: idPathParams,
        responses: { 200: { description: "OK" }, 404: errorResponse },
      },
    },
    "/audit-logs": {
      get: {
        tags: ["AuditLog"],
        summary: "Riwayat audit log (ADMIN)",
        security: bearerSecurity,
        parameters: listParams([
          { name: "tabel_nama", in: "query", schema: { type: "string" } },
          { name: "aksi", in: "query", schema: { type: "string" } },
          { name: "id_pengguna", in: "query", schema: { type: "integer" } },
          { name: "dari", in: "query", schema: { type: "string", format: "date-time" } },
          { name: "sampai", in: "query", schema: { type: "string", format: "date-time" } },
        ]),
        responses: { 200: paginated("#/components/schemas/AuditLog"), 401: errorResponse },
      },
    },
    "/reports/mahasiswa-per-prodi": {
      get: {
        tags: ["Reports"],
        summary: "Rekap mahasiswa per program studi (view v_mahasiswa_per_prodi)",
        security: bearerSecurity,
        parameters: listParams([
          { name: "status_mahasiswa", in: "query", schema: { type: "string" } },
          { name: "id_program_studi", in: "query", schema: { type: "integer" } },
        ]),
        responses: { 200: { description: "OK" } },
      },
    },
    "/reports/statistik-mahasiswa": {
      get: {
        tags: ["Reports"],
        summary: "Statistik jumlah mahasiswa per status dan per prodi",
        security: bearerSecurity,
        responses: { 200: { description: "OK" } },
      },
    },
  },
  tags: [
    { name: "Auth" },
    { name: "Universitas" },
    { name: "Fakultas" },
    { name: "ProgramStudi" },
    { name: "Roles" },
    { name: "Pengguna" },
    { name: "Mahasiswa" },
    { name: "AuditLog" },
    { name: "Reports" },
  ],
};
