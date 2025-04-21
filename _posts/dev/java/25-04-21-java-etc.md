---
title       : 기타 java 관련 내용 정리
description : 
date        : 2025-04-20 09:01:11 +0900
updated     : 2025-04-20 09:01:11 +0900
categories  : [dev, java]
tags        : [java, compile]
pin         : false
hidden      : false
---

# 두개의 Map 합치기
## HashMap.putAll()
같은 key가 있을 때, value를 덮어 씀.
```java
import java.util.HashMap;
import java.util.Map;
public class MergeHashMap {
    public static void main(String[] args) {
        // Map 1 준비
        Map<String, Integer> map1 = new HashMap<>();
        map1.put("Apple", 1000);
        map1.put("Banana", 2000);
        map1.put("Orange", 3000);
        
        // Map 2 준비
        Map<String, Integer> map2 = new HashMap<>();
        map2.put("Apple", 4000);
        map2.put("Tomato", 5000);
        map2.put("WaterMelon", 6000);
        
        // Map1 + Map2
        map1.putAll(map2);
        
        // 결과 출력
        System.out.println(map1); // {Apple=4000, WaterMelon=6000, Tomato=5000, Orange=3000, Banana=2000}
    }
}
```

## HashMap.merge - Java8 이후
```java
import java.util.HashMap;
import java.util.Map;
public class MergeHashMap {
    public static void main(String[] args) {
        // Map 1 준비
        Map<String, Integer> map1 = new HashMap<>();
        map1.put("Apple", 1000);
        map1.put("Banana", 2000);
        map1.put("Orange", 3000);
        
        // Map 2 준비
        Map<String, Integer> map2 = new HashMap<>();
        map2.put("Apple", 4000);
        map2.put("Tomato", 5000);
        map2.put("WaterMelon", 6000);
        
        // Map1 + Map2
        map2.forEach((key, value) -> map1.merge(key, value, (v1, v2) -> v2));
        
        // 결과 출력
        System.out.println(map1); // {Apple=4000, WaterMelon=6000, Tomato=5000, Orange=3000, Banana=2000}
    }
}
```

## 같은 key일 경우, value합계 반영하기
```java
import java.util.HashMap;
import java.util.Map;
public class MergeHashMap {
    public static void main(String[] args) {
        // Map 1 준비
        Map<String, Integer> map1 = new HashMap<>();
        map1.put("Apple", 1000);
        map1.put("Banana", 2000);
        map1.put("Orange", 3000);
        
        // Map 2 준비
        Map<String, Integer> map2 = new HashMap<>();
        map2.put("Apple", 4000);
        map2.put("Tomato", 5000);
        map2.put("WaterMelon", 6000);
        
        // Map1 + Map2
        map2.forEach((key, value) -> map1.merge(key, value, (v1, v2) -> v1 + v2));
        
        // 결과 출력
        System.out.println(map1); // {Apple=5000, WaterMelon=6000, Tomato=5000, Orange=3000, Banana=2000}
    }
}

출처: https://hianna.tistory.com/580 [어제 오늘 내일]
```

--- 

# Apache Poi 라이브러리로 엑셀 파일 읽어오기

## 의존성 추가
```gradle
implementation group: 'org.apache.poi', name: 'poi', version: '4.1.2'
implementation group: 'org.apache.poi', name: 'poi-ooxml', version: '4.1.2'
```

##  excel util
### 시트의 각 행을 key-value list(List<Map<String, Object>>)형태로 읽어옴
```java
public class ExcelUtils {
    private static final Logger log = LoggerFactory.getLogger(ExcelUtils.class);

    public static Workbook getWorkbookFromStream(InputStream targetStream, String extension) throws Exception {
        log.debug("Read workbook from {}", targetStream);

        checkExcelExtension(extension);

        Workbook workbook = null;
        try {
            if (extension.equals("xlsx")) {
                workbook = new XSSFWorkbook(targetStream);
            } else if (extension.equals("xls")) {
                workbook = new HSSFWorkbook(targetStream);
            }
        } catch (InvalidFormatException e) {
            e.printStackTrace();
        } catch (IOException e) {
            e.printStackTrace();
        }

        return workbook;
    }

    private static void checkExcelExtension(String extension) throws Exception {
        if (!extension.equals("xlsx") && !extension.equals("xls")) {
            throw new IOException("엑셀 아닙니다.");
        }
    }

    public static List<Map<String, Object>> readSheet(Workbook workbook, String sheetName) throws Exception {
        log.debug("Read sheet name : {}", sheetName);

        Sheet sheet = workbook.getSheet(sheetName);

        if (sheet == null) {
            sheet = workbook.getSheetAt(0);
        }

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

    public static LinkedHashMap<String, Object> readRow(Workbook workbook, String sheetName, int rowNum) throws Exception {
        log.debug("Read {} row num : {}", sheetName, rowNum);

        Sheet sheet = workbook.getSheet(sheetName);

        if (sheet == null) {
            sheet = workbook.getSheetAt(0);
        }

        Row header = sheet.getRow(ExcelConstants.HEADER_ROW_NUMBER);
        Row targetRow = sheet.getRow(rowNum);

        return getHeaderRowWeaved(header, targetRow);
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
        log.debug("Read cell : {}", cell.getStringCellValue());

        Object value = null;

        if (cell == null) {
            return value;
        }

        if (cell.getCellType() == CellType.NUMERIC && DateUtil.isCellDateFormatted(cell)) {
            return cell.getDateCellValue().toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        }

        switch (cell.getCellType()) {
            case FORMULA:
                CellType type = cell.getCachedFormulaResultType();
                if (type == CellType.NUMERIC) {
                    value = cell.getNumericCellValue();
                } else {
                    value = cell.getStringCellValue();
                }
                break;
            case NUMERIC:
                value = cell.getNumericCellValue();
                break;
            case BOOLEAN:
                value = cell.getBooleanCellValue();
                break;
            case ERROR:
                value = cell.getErrorCellValue();
                break;
            case BLANK:
                value = null;
                break;
            default:
                value = cell.getStringCellValue();
                break;
        }

        return value;
    }

}
```

---

# undewtow 복수 포트 점령하기
## http -> https로
```java
@Configuration
public class UndertowConfig {

    @Value("${http.port:0}")
    private int httpPort;

    @Value("${server.port:0}")
    private int sslPort;

    @Bean
    @Profile(JHipsterConstants.SPRING_PROFILE_PRODUCTION)
    public ServletWebServerFactory serverFactory() {
        UndertowServletWebServerFactory factory = new UndertowServletWebServerFactory();

        factory.addBuilderCustomizers(builder -> {
            builder.addHttpListener(httpPort, "0.0.0.0");
        });

        factory.addDeploymentInfoCustomizers(deploymentInfo -> {
            deploymentInfo.addSecurityConstraint(
                new SecurityConstraint()
                    .addWebResourceCollection(new WebResourceCollection().addUrlPattern("/*"))
                    .setTransportGuaranteeType(TransportGuaranteeType.CONFIDENTIAL)
                    .setEmptyRoleSemantic(SecurityInfo.EmptyRoleSemantic.PERMIT))
                .setConfidentialPortManager(exchange -> sslPort);
        });

        return factory;
    }
}
```


---

## 객체 list를 map으로 변환하기
title, deription을 속성으로 가지고 있는 test domain의 list을 Map<key,value> 형태로 변환
```java
public class ListToMapTransform{
    public static void main(String[] args){
        Map<String, String> result = testRepository.findAll()
            .stream()
            .filter(test -> StringUtils.isNotEmpty(test.getTitle()) && StringUtils.isNotEmpty(test.getDescription()))
            .collect(Collectors.toMap(i1 -> i1.getTitle(), i2 -> i2.getDescription()));
    }
}
```

---

# 스프링 mybatis 사용시 두개 db 이용하기

## yaml 설정
```yaml
spring:
  datasource:
    hikari:
      primary:
        driver-class-name: org.h2.Driver
        jdbc-url: jdbc:h2:file:./build/h2db/db/healthcare_tableau;DB_CLOSE_DELAY=-1
        username: Healthcare_Tableau
        password:
      secondary:
        driver-class-name: org.h2.Driver
        jdbc-url: jdbc:h2:file:./build/h2db/db/healthcare_tableau;DB_CLOSE_DELAY=-1
        username: Healthcare_Tableau
        password:
```


## DB 설정1
```java
@Configuration
@EnableTransactionManagement
@MapperScan(value = {"com.test.dao.primary"}, sqlSessionFactoryRef = "primarySqlSessionFactory")
public class PrimaryDatasourceConfiguration {
    @Bean
    @Primary
    @Qualifier("primaryHikariConfig")
    @ConfigurationProperties(prefix = "spring.datasource.hikari.primary")
    public HikariConfig primaryHikariConfig() {
        return new HikariConfig();
    }

    @Bean
    @Primary
    @Qualifier("primaryDataSource")
    public DataSource primaryDataSource() {
        return new HikariDataSource(primaryHikariConfig());
    }

    @Primary
    @Bean(name = "primarySqlSessionFactory")
    public SqlSessionFactory sqlSessionFactory(@Qualifier("primaryDataSource") DataSource dataSource, ApplicationContext applicationContext) throws Exception {
        SqlSessionFactoryBean sqlSessionFactoryBean = new SqlSessionFactoryBean();
        sqlSessionFactoryBean.setDataSource(dataSource);
        sqlSessionFactoryBean.setMapperLocations(applicationContext.getResources("classpath:mapper/primary/*.xml"));
        sqlSessionFactoryBean.setTypeAliasesPackage("com.test.service.dto");

        return sqlSessionFactoryBean.getObject();
    }

    @Primary
    @Bean(name = "primarySqlSessionTemplate")
    public SqlSessionTemplate sqlSessionTemplate(@Qualifier("primarySqlSessionFactory") SqlSessionFactory sqlSessionFactory) {
        return new SqlSessionTemplate(sqlSessionFactory);
    }
}
```

## DB 설정2
```java
@Configuration
@EnableTransactionManagement
@MapperScan(value = {"com.test.dao.secondary"}, sqlSessionFactoryRef = "secondarySqlSessionFactory")
public class SecondaryDatasourceConfiguration {
    @Bean
    @Qualifier("secondaryHikariConfig")
    @ConfigurationProperties(prefix = "spring.datasource.hikari.secondary")
    public HikariConfig secondaryHikariConfig() {
        return new HikariConfig();
    }

    @Bean
    @Qualifier("secondaryDataSource")
    public DataSource secondaryDataSource() {
        return new HikariDataSource(secondaryHikariConfig());
    }

    @Bean(name = "secondarySqlSessionFactory")
    public SqlSessionFactory sqlSessionFactory(@Qualifier("secondaryDataSource") DataSource dataSource, ApplicationContext applicationContext) throws Exception {
        SqlSessionFactoryBean sqlSessionFactoryBean = new SqlSessionFactoryBean();
        sqlSessionFactoryBean.setDataSource(dataSource);
        sqlSessionFactoryBean.setMapperLocations(applicationContext.getResources("classpath:mapper/secondary/*.xml"));
        sqlSessionFactoryBean.setTypeAliasesPackage("com.test.service.dto");

        return sqlSessionFactoryBean.getObject();
    }

    @Bean(name = "secondarySqlSessionTemplate")
    public SqlSessionTemplate sqlSessionTemplate(@Qualifier("secondarySqlSessionFactory") SqlSessionFactory sqlSessionFactory) {
        return new SqlSessionTemplate(sqlSessionFactory);
    }
}
```
