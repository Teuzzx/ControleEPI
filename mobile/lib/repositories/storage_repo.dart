import 'dart:io';

import 'package:supabase_flutter/supabase_flutter.dart';

/// Upload de fotos e assinaturas no bucket público "movements".
class StorageRepo {
  static const bucket = 'movements';

  static Future<String> upload({
    required SupabaseClient client,
    required String folder,
    required String fileName,
    required String filePath,
  }) async {
    final file = File(filePath);
    final path = '$folder/$fileName';
    await client.storage.from(bucket).upload(path, file, fileOptions: const FileOptions(upsert: true));
    return client.storage.from(bucket).getPublicUrl(path);
  }
}
