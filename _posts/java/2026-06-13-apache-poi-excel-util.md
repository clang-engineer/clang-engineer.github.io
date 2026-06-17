---
title       : "Apache POI로 엑셀 파일 읽기 — Workbook/Sheet 유틸"
description : "InputStream에서 Workbook을 만들고 Sheet의 각 행을 헤더 키 기반 Map으로 변환하는 ExcelUtils"
date        : 2026-06-13 10:00:00 +0900
updated     : 2026-06-13 10:00:00 +0900
categories  : [java, "프레임워크·실무"]
tags        : [apache-poi, excel]
pin         : false
hidden      : false
---

업로드된 엑셀을 InputStream에서 받아 헤더 키 기반의 `List<Map<String, Object>>`로 다루는 유틸 패턴.

## 의존성

```gradle
implementation group: 'org.apache.poi', name: 'poi', version: '4.1.2'
implementation group: 'org.apache.poi', name: 'poi-ooxml', version: '4.1.2'
```

`.xlsx`는 `poi-ooxml`이, `.xls`는 `poi`가 처리한다.

## ExcelUtils

```java
public class ExcelUtils {
    private static final Logger log = LoggerFactory.getLogger(ExcelUtils.class);

    public static Workbook getWorkbookFromStream(InputStream targetStream, String extension) throws Exception {
        checkExcelExtension(extension);

        if (extension.equals("xlsx")) return new XSSFWorkbook(targetStream);
        if (extension.equals("xls"))  return new HSSFWorkbook(targetStream);
        return null;
    }

    private static void checkExcelExtension(String extension) throws Exception {
        if (!extension.equals("xlsx") && !extension.equals("xls")) {
            throw new IOException("엑셀 아닙니다.");
        }
    }

    public static List<Map<String, Object>> readSheet(Workbook workbook, String sheetName) {
        Sheet sheet = Optional.ofNullable(workbook.getSheet(sheetName))
            .orElse(workbook.getSheetAt(0));

        Row header = sheet.getRow(ExcelConstants.HEADER_ROW_NUMBER);
        List<Map<String, Object>> result = new ArrayList<>();

        for (int rowIndex = 2; rowIndex < sheet.getLastRowNum() + 1; rowIndex++) {
            Row row = sheet.getRow(rowIndex);
            if (isNotEmptyCell(row.getCell(0))) {
                Map<String, Object> keymapfiedRow = getHeaderRowWeaved(header, row);
                keymapfiedRow.put("excelRowNum", rowIndex);
                result.add(keymapfiedRow);
            }
        }
        return result;
    }

    private static LinkedHashMap<String, Object> getHeaderRowWeaved(Row header, Row row) {
        LinkedHashMap<String, Object> result = new LinkedHashMap<>();
        for (int columnIndex = 0; columnIndex <= header.getLastCellNum(); columnIndex++) {
            Cell headerCell = header.getCell(columnIndex);
            if (isNotEmptyCell(headerCell)) {
                Cell cell = row.getCell(columnIndex);
                result.put((String) readCell(headerCell), readCell(cell));
            }
        }
        return result;
    }

    private static boolean isNotEmptyCell(Cell cell) {
        return cell != null && !cell.toString().isBlank();
    }

    private static Object readCell(Cell cell) {
        if (cell == null) return null;

        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }

        switch (cell.getCellType()) {
            case FORMULA:
                return cell.getCachedFormulaResultType() == CellType.NUMERIC
                    ? cell.getNumericCellValue()
                    : cell.getStringCellValue();
            case NUMERIC: return cell.getNumericCellValue();
            case BOOLEAN: return cell.getBooleanCellValue();
            case ERROR:   return cell.getErrorCellValue();
            case BLANK:   return null;
            default:      return cell.getStringCellValue();
        }
    }
}
```

## 사용 패턴

```java
try (InputStream is = file.getInputStream()) {
    Workbook wb = ExcelUtils.getWorkbookFromStream(is, "xlsx");
    List<Map<String, Object>> rows = ExcelUtils.readSheet(wb, "Sheet1");
    rows.forEach(row -> /* 도메인 객체로 매핑 */);
}
```

데이터 시작 행이 `2`로 고정돼 있는 등 헤더 컨벤션이 박혀 있으니, 실제 양식에 맞춰 `HEADER_ROW_NUMBER`와 시작 인덱스를 조정해서 쓴다.
