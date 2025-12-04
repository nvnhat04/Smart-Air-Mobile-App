"""
Script test để kiểm tra TiTiler server và các endpoints
"""
import json
from datetime import datetime

import requests

# Server URL
BASE_URL = "http://localhost:8000"

def print_section(title):
    """Print section header"""
    print("\n" + "="*60)
    print(f"  {title}")
    print("="*60)

def test_health():
    """Test health endpoint"""
    print_section("1. Health Check")
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_root():
    """Test root endpoint"""
    print_section("2. Root Information")
    try:
        response = requests.get(f"{BASE_URL}/")
        print(f"Status: {response.status_code}")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_available_dates():
    """Test available dates endpoint"""
    print_section("3. Available Dates")
    try:
        response = requests.get(f"{BASE_URL}/pm25/dates")
        print(f"Status: {response.status_code}")
        data = response.json()
        print(json.dumps(data, indent=2))
        return response.status_code == 200, data.get('dates', [])
    except Exception as e:
        print(f"Error: {e}")
        return False, []

def test_tilejson(date=None):
    """Test TileJSON endpoint"""
    print_section("4. TileJSON")
    try:
        url = f"{BASE_URL}/pm25/tilejson.json"
        if date:
            url += f"?date={date}"
        
        response = requests.get(url)
        print(f"Status: {response.status_code}")
        print(f"URL: {url}")
        print(json.dumps(response.json(), indent=2))
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_tile(date=None, z=11, x=1626, y=901):
    """Test tile endpoint"""
    print_section("5. Tile Request")
    try:
        url = f"{BASE_URL}/pm25/tiles/{z}/{x}/{y}.png"
        params = {
            'colormap_name': 'rdylgn_r',
            'rescale': '0,150'
        }
        if date:
            params['date'] = date
        
        response = requests.get(url, params=params)
        print(f"Status: {response.status_code}")
        print(f"URL: {url}")
        print(f"Params: {params}")
        print(f"Content-Type: {response.headers.get('Content-Type')}")
        print(f"Content-Length: {len(response.content)} bytes")
        
        if response.status_code == 200:
            # Lưu tile để kiểm tra
            filename = f"test_tile_{z}_{x}_{y}.png"
            with open(filename, 'wb') as f:
                f.write(response.content)
            print(f"Tile saved to: {filename}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        return False

def test_cog_info(date=None):
    """Test COG info endpoint"""
    print_section("6. COG Info")
    try:
        # Lấy file path từ dates endpoint
        dates_response = requests.get(f"{BASE_URL}/pm25/dates")
        if dates_response.status_code != 200:
            print("Cannot get dates")
            return False
        
        dates = dates_response.json().get('dates', [])
        if not dates:
            print("No dates available")
            return False
        
        # Lấy file đầu tiên hoặc file theo date
        target_file = None
        if date:
            for d in dates:
                if d['date_str'] == date:
                    target_file = d['filename']
                    break
        else:
            target_file = dates[0]['filename']
        
        if not target_file:
            print(f"Cannot find file for date: {date}")
            return False
        
        # Tạo file URL
        import os
        from pathlib import Path
        script_dir = Path(__file__).parent
        tif_path = script_dir / "tif_file" / target_file
        file_url = f"file://{tif_path.as_posix()}"
        
        url = f"{BASE_URL}/cog/info"
        params = {'url': file_url}
        
        response = requests.get(url, params=params)
        print(f"Status: {response.status_code}")
        print(f"URL: {url}")
        print(f"File: {target_file}")
        
        if response.status_code == 200:
            # Print only key information
            data = response.json()
            print("\nKey Information:")
            print(f"  Bounds: {data.get('bounds', 'N/A')}")
            print(f"  MinZoom: {data.get('minzoom', 'N/A')}")
            print(f"  MaxZoom: {data.get('maxzoom', 'N/A')}")
            print(f"  Band Count: {data.get('count', 'N/A')}")
            print(f"  DataType: {data.get('dtype', 'N/A')}")
            print(f"  Width: {data.get('width', 'N/A')}")
            print(f"  Height: {data.get('height', 'N/A')}")
        
        return response.status_code == 200
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Run all tests"""
    print("\n" + "="*60)
    print("  TiTiler PM2.5 Server Test Suite")
    print("="*60)
    print(f"  Base URL: {BASE_URL}")
    print(f"  Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("="*60)
    
    results = []
    
    # Test 1: Health
    results.append(("Health Check", test_health()))
    
    # Test 2: Root
    results.append(("Root Info", test_root()))
    
    # Test 3: Available Dates
    success, dates = test_available_dates()
    results.append(("Available Dates", success))
    
    # Get first date for other tests
    test_date = None
    if dates and len(dates) > 0:
        test_date = dates[0]['date_str']
        print(f"\nUsing date for tests: {test_date}")
    
    # Test 4: TileJSON
    results.append(("TileJSON", test_tilejson(test_date)))
    
    # Test 5: Tile
    results.append(("Tile Request", test_tile(test_date)))
    
    # Test 6: COG Info
    results.append(("COG Info", test_cog_info(test_date)))
    
    # Summary
    print_section("Test Summary")
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for name, result in results:
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"  {status:8} - {name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1

if __name__ == "__main__":
    try:
        exit(main())
    except KeyboardInterrupt:
        print("\n\nTests interrupted by user")
        exit(1)
