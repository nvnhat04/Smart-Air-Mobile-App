#!/usr/bin/env python3
"""
Tool tự động tải ảnh TIF từ MinIO cho 7 ngày tiếp theo
Tính từ 00:00 hiện tại

Có 2 chế độ chạy:
1. Chạy một lần: python -m tools.tif_downloader
2. Scheduler (tự động mỗi ngày lúc 00:00):
   python -m tools.tif_downloader --scheduler

Usage:
    # Chạy một lần
    python -m tools.tif_downloader
    hoặc
    python server/tools/tif_downloader.py
    hoặc (Unix/Mac)
    ./server/tools/tif_downloader.py

    # Chạy scheduler tự động
    python -m tools.tif_downloader --scheduler

Environment Variables (set trong .env file):
    MINIO_ENDPOINT=112.137.129.244:9001
    MINIO_ACCESS_KEY=your_access_key
    MINIO_SECRET_KEY=your_secret_key
    MINIO_BUCKET=nrt-sci-pm25-map-daily-1km
    MINIO_SECURE=false
"""
import argparse
import logging
import os
import sys
import time
from datetime import datetime, timedelta
from pathlib import Path

# Thêm thư mục server vào path để import config
# Phải đặt trước các import từ app.*
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
from minio import Minio, S3Error

from app.core.config import settings

# Setup logging trước để có thể log
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Load environment variables từ .env file
env_path = Path(__file__).parent.parent / '.env'
if env_path.exists():
    load_dotenv(dotenv_path=env_path)
    logger.debug(f'✅ Đã load .env file từ: {env_path}')
else:
    logger.warning(
        f'⚠️  Không tìm thấy file .env tại: {env_path}. '
        'Sẽ sử dụng environment variables hoặc giá trị mặc định.'
    )

# MinIO Configuration - đọc trực tiếp từ .env file
MINIO_ENDPOINT = os.getenv('MINIO_ENDPOINT', '112.137.129.244:9001')
MINIO_ACCESS_KEY = os.getenv('MINIO_ACCESS_KEY', '')
MINIO_SECRET_KEY = os.getenv('MINIO_SECRET_KEY', '')
MINIO_BUCKET = os.getenv('MINIO_BUCKET', 'nrt-sci-pm25-map-daily-1km')
MINIO_SECURE = os.getenv(
    'MINIO_SECURE', 'false'
).lower() in ('true', '1', 'yes')

# Log để debug
if not MINIO_ACCESS_KEY or not MINIO_SECRET_KEY:
    logger.warning(
        '⚠️  MinIO credentials chưa được set trong .env file. '
        'Tool sẽ không thể tải file nếu thiếu credentials.'
    )
    logger.debug(
        f'MINIO_ENDPOINT: {MINIO_ENDPOINT}, '
        f'MINIO_BUCKET: {MINIO_BUCKET}, '
        f'MINIO_ACCESS_KEY: {"***" if MINIO_ACCESS_KEY else "NOT SET"}, '
        f'MINIO_SECRET_KEY: {"***" if MINIO_SECRET_KEY else "NOT SET"}'
    )

# Thư mục lưu file TIF
TIF_DIR = settings.TIF_DIR


def get_next_7_days():
    """
    Tính toán 7 ngày tiếp theo từ 00:00 hiện tại

    Returns:
        List of date strings in YYYYMMDD format
    """
    today = datetime.now().replace(
        hour=0, minute=0, second=0, microsecond=0
    )
    dates = []

    for i in range(1, 8):  # 7 ngày tiếp theo (từ ngày mai đến +7 ngày)
        date = today + timedelta(days=i)
        date_str = date.strftime('%Y%m%d')
        dates.append(date_str)

    return dates


def get_minio_file_path(date_str, resolution='1km'):
    """
    Tạo đường dẫn file trong MinIO dựa trên ngày và resolution

    Args:
        date_str: Date string in YYYYMMDD format (ví dụ: '20251224')
        resolution: '1km' hoặc '3km' (mặc định: '1km')

    Returns:
        MinIO object path (string)
        Format: 'YYYY/MM/DD/PM25_YYYYMMDD_{resolution}NRT.tif'
        Ví dụ: '2025/12/24/PM25_20251224_1kmNRT.tif'
    """
    # Parse date_str thành YYYY, MM, DD
    year = date_str[:4]
    month = date_str[4:6]
    day = date_str[6:8]
    
    # Format: 'YYYY/MM/DD/PM25_YYYYMMDD_{resolution}NRT.tif'
    return f'{year}/{month}/{day}/PM25_{date_str}_{resolution}NRT.tif'


def download_tif_from_minio(
    mc: Minio, bucket: str, minio_path: str, local_path: Path
):
    """
    Tải file TIF từ MinIO về local

    Args:
        mc: MinIO client instance
        bucket: MinIO bucket name
        minio_path: Path to file in MinIO
        local_path: Local path to save file

    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Tạo thư mục nếu chưa tồn tại
        local_path.parent.mkdir(parents=True, exist_ok=True)

        # Tải file từ MinIO
        logger.info(f'📥 Đang tải: {minio_path} -> {local_path}')
        mc.fget_object(bucket, minio_path, str(local_path))

        # Kiểm tra file đã được tải thành công
        if local_path.exists() and local_path.stat().st_size > 0:
            file_size_mb = local_path.stat().st_size / (1024 * 1024)
            logger.info(
                f'✅ Tải thành công: {local_path.name} '
                f'({file_size_mb:.2f} MB)'
            )
            return True
        else:
            logger.error(
                f'❌ File tải về rỗng hoặc không tồn tại: {local_path}'
            )
            return False

    except S3Error as e:
        if e.code == 'NoSuchKey':
            logger.warning(
                f'⚠️  File không tồn tại trong MinIO: {minio_path}'
            )
        else:
            logger.error(f'❌ Lỗi MinIO khi tải {minio_path}: {e}')
        return False
    except Exception as e:
        logger.error(f'❌ Lỗi khi tải {minio_path}: {e}')
        return False


def check_file_exists_in_minio(mc: Minio, bucket: str, minio_path: str):
    """
    Kiểm tra file có tồn tại trong MinIO không

    Args:
        mc: MinIO client instance
        bucket: MinIO bucket name
        minio_path: Path to file in MinIO

    Returns:
        bool: True if exists, False otherwise
    """
    try:
        mc.stat_object(bucket, minio_path)
        return True
    except S3Error as e:
        if e.code == 'NoSuchKey':
            return False
        raise
    except Exception as e:
        logger.warning(f'⚠️  Lỗi khi kiểm tra file {minio_path}: {e}')
        return False


def download_tif_files():
    """
    Hàm chính: Tải ảnh TIF cho 7 ngày tiếp theo từ MinIO
    """
    # Validate credentials
    if not MINIO_ACCESS_KEY or not MINIO_SECRET_KEY:
        error_msg = (
            '❌ MinIO credentials chưa được cấu hình. '
            'Vui lòng set MINIO_ACCESS_KEY và MINIO_SECRET_KEY '
            'trong file .env hoặc environment variables.'
        )
        logger.error(error_msg)
        raise ValueError(error_msg)  # Raise exception để caller biết

    logger.info('🚀 Bắt đầu tải ảnh TIF từ MinIO...')

    # Tạo thư mục TIF nếu chưa tồn tại
    TIF_DIR.mkdir(parents=True, exist_ok=True)
    logger.info(f'📁 Thư mục lưu file: {TIF_DIR}')

    # Kết nối MinIO
    try:
        logger.info(f'🔌 Đang kết nối MinIO: {MINIO_ENDPOINT}')
        mc = Minio(
            MINIO_ENDPOINT,
            access_key=MINIO_ACCESS_KEY,
            secret_key=MINIO_SECRET_KEY,
            secure=MINIO_SECURE
        )

        # Kiểm tra bucket có tồn tại không
        if not mc.bucket_exists(MINIO_BUCKET):
            logger.error(f'❌ Bucket không tồn tại: {MINIO_BUCKET}')
            return

        logger.info(
            f'✅ Kết nối MinIO thành công. Bucket: {MINIO_BUCKET}'
        )

    except Exception as e:
        logger.error(f'❌ Lỗi kết nối MinIO: {e}')
        return

    # Lấy danh sách 7 ngày tiếp theo
    dates = get_next_7_days()
    logger.info(
        f'📅 Sẽ tải file cho {len(dates)} ngày: '
        f'{dates[0]} đến {dates[-1]}'
    )

    # Thống kê
    success_count = 0
    error_count = 0

    # Tải từng file - ưu tiên 1km, fallback sang 3km
    for date_str in dates:
        # Thử tải 1km trước (ưu tiên)
        minio_path_1km = get_minio_file_path(date_str, '1km')
        local_filename_1km = f'PM25_{date_str}_1kmNRT.tif'
        local_path_1km = TIF_DIR / local_filename_1km

        # Kiểm tra file đã tồn tại để log thông tin ghi đè
        if local_path_1km.exists():
            old_size_mb = local_path_1km.stat().st_size / (1024 * 1024)
            logger.info(
                f'🔄 File đã tồn tại, sẽ ghi đè: {local_filename_1km} '
                f'(kích thước cũ: {old_size_mb:.2f} MB)'
            )

        # Tải file 1km (sẽ tự động ghi đè nếu file đã tồn tại)
        if download_tif_from_minio(
            mc, MINIO_BUCKET, minio_path_1km, local_path_1km
        ):
            success_count += 1
        else:
            # Nếu không tải được 1km, thử tải 3km (fallback)
            logger.info(
                f'⚠️  Không tải được 1km, thử tải 3km cho ngày {date_str}'
            )
            minio_path_3km = get_minio_file_path(date_str, '3km')
            local_filename_3km = f'PM25_{date_str}_3kmNRT.tif'
            local_path_3km = TIF_DIR / local_filename_3km

            if local_path_3km.exists():
                old_size_mb = local_path_3km.stat().st_size / (1024 * 1024)
                logger.info(
                    f'🔄 File đã tồn tại, sẽ ghi đè: {local_filename_3km} '
                    f'(kích thước cũ: {old_size_mb:.2f} MB)'
                )

            if download_tif_from_minio(
                mc, MINIO_BUCKET, minio_path_3km, local_path_3km
            ):
                success_count += 1
            else:
                error_count += 1
                logger.warning(
                    f'❌ Không tải được cả 1km và 3km cho ngày {date_str}'
                )

    # Tổng kết
    logger.info('=' * 60)
    logger.info('📊 TỔNG KẾT:')
    logger.info(f'   ✅ Thành công: {success_count} file')
    logger.info(f'   ❌ Lỗi: {error_count} file')
    logger.info(f'   📁 Tổng cộng: {len(dates)} ngày')
    logger.info(f'   📂 Thư mục lưu: {TIF_DIR}')
    logger.info('=' * 60)


def run_download_task():
    """Hàm wrapper để chạy task download TIF"""
    logger.info('=' * 60)
    logger.info('⏰ Bắt đầu task tải TIF tự động (00:00)')
    logger.info('=' * 60)

    try:
        download_tif_files()
        logger.info('✅ Task hoàn thành thành công')
    except Exception as e:
        logger.error(f'❌ Lỗi khi chạy task: {e}', exc_info=True)

    logger.info('=' * 60)


def run_scheduler():
    """Hàm chính: Setup scheduler và chạy liên tục"""
    try:
        import schedule
    except ImportError:
        logger.error(
            "❌ Cần cài đặt thư viện 'schedule': pip install schedule"
        )
        sys.exit(1)

    # Setup logging cho scheduler (thêm file handler)
    scheduler_logger = logging.getLogger(__name__)
    file_handler = logging.FileHandler('download_tif_scheduler.log')
    file_handler.setFormatter(
        logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
    )
    scheduler_logger.addHandler(file_handler)

    scheduler_logger.info('🚀 Khởi động Scheduler tải TIF tự động')
    scheduler_logger.info('📅 Lịch chạy: Mỗi ngày lúc 00:00 (đầu ngày)')
    scheduler_logger.info('💡 Nhấn Ctrl+C để dừng scheduler')
    scheduler_logger.info('-' * 60)

    # Schedule task chạy mỗi ngày lúc 00:00
    schedule.every().day.at("00:00").do(run_download_task)

    # Chạy ngay lần đầu nếu muốn (optional)
    # Uncomment dòng dưới nếu muốn chạy ngay khi start scheduler
    # scheduler_logger.info('🔄 Chạy task ngay lần đầu...')
    # run_download_task()

    # Vòng lặp chính: kiểm tra và chạy scheduled tasks
    scheduler_logger.info('⏳ Đang chờ đến 00:00 để chạy task...')
    scheduler_logger.info(
        f'⏰ Thời gian hiện tại: '
        f'{datetime.now().strftime("%Y-%m-%d %H:%M:%S")}'
    )

    try:
        while True:
            schedule.run_pending()
            time.sleep(60)  # Kiểm tra mỗi 60 giây

            # Log thời gian còn lại đến lần chạy tiếp theo
            if schedule.jobs:
                next_run = schedule.jobs[0].next_run
                if next_run:
                    now = datetime.now()
                    time_until = next_run - now
                    hours = int(time_until.total_seconds() // 3600)
                    minutes = int(
                        (time_until.total_seconds() % 3600) // 60
                    )
                    scheduler_logger.debug(
                        f'⏳ Lần chạy tiếp theo: '
                        f'{next_run.strftime("%Y-%m-%d %H:%M:%S")} '
                        f'(còn {hours}h {minutes}m)'
                    )

    except KeyboardInterrupt:
        scheduler_logger.info('\n🛑 Đang dừng scheduler...')
        scheduler_logger.info('👋 Tạm biệt!')
        sys.exit(0)
    except Exception as e:
        scheduler_logger.error(
            f'❌ Lỗi trong scheduler: {e}', exc_info=True
        )
        sys.exit(1)


def main():
    """Hàm main: Xử lý arguments và chạy chế độ tương ứng"""
    parser = argparse.ArgumentParser(
        description='Tool tự động tải ảnh TIF từ MinIO'
    )
    parser.add_argument(
        '--scheduler',
        action='store_true',
        help='Chạy scheduler tự động mỗi ngày lúc 00:00'
    )

    args = parser.parse_args()

    if args.scheduler:
        run_scheduler()
    else:
        download_tif_files()


if __name__ == '__main__':
    main()

