import 'package:hive_ce_flutter/hive_flutter.dart';

/// Inicializa as caixas locais (Hive) usadas pelo app.
/// - session        : sessão atual (JSON)
/// - cache_employees: cache offline de colaboradores
/// - cache_stock    : cache offline do estoque
/// - pending_ops    : fila de operações pendentes (offline)
/// - failed_ops     : operações que falharam na sincronização
class HiveService {
  static const sessionBox = 'session';
  static const employeesCacheBox = 'cache_employees';
  static const stockCacheBox = 'cache_stock';
  static const pendingOpsBox = 'pending_ops';
  static const failedOpsBox = 'failed_ops';

  static Future<void> init() async {
    await Hive.initFlutter();
    await Hive.openBox<String>(sessionBox);
    await Hive.openBox(employeesCacheBox);
    await Hive.openBox(stockCacheBox);
    await Hive.openBox(pendingOpsBox);
    await Hive.openBox(failedOpsBox);
  }
}
