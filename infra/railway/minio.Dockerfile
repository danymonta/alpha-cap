FROM pgsty/minio:RELEASE.2026-08-04T00-00-00Z@sha256:b6bfe7239bfc83fb90d31612d9704d86039dd714f7904b3f1ad68f211e602372

EXPOSE 9000

ENTRYPOINT ["/bin/sh", "-c", "minio server /data --address :9000 --console-address :9001 & until mc alias set local http://127.0.0.1:9000 \"$MINIO_ROOT_USER\" \"$MINIO_ROOT_PASSWORD\" >/dev/null 2>&1; do sleep 1; done; mc mb --ignore-existing \"local/${S3_BUCKET:-cap}\"; wait"]
