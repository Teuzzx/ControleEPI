import 'dart:io';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:path_provider/path_provider.dart';
import 'package:signature/signature.dart';
import 'package:uuid/uuid.dart';

import '../../core/theme.dart';

/// Resultado da captura (foto e/ou assinatura) — caminhos locais estáveis.
class CaptureResult {
  final String? photoPath;
  final String? signaturePath;

  const CaptureResult({this.photoPath, this.signaturePath});
}

/// Tela única de captura: foto do EPI (câmera/galeria) + assinatura digital.
/// Retorna [CaptureResult] via Navigator.pop.
class CapturePage extends ConsumerStatefulWidget {
  const CapturePage({super.key, this.requirePhoto = true, this.requireSignature = true});

  final bool requirePhoto;
  final bool requireSignature;

  @override
  ConsumerState<CapturePage> createState() => _CapturePageState();
}

class _CapturePageState extends ConsumerState<CapturePage> {
  final _picker = ImagePicker();
  final _sigCtrl = SignatureController(
    penStrokeWidth: 3,
    penColor: kText,
    exportBackgroundColor: Colors.white,
    exportPenColor: const Color(0xFF1A1D2E),
  );

  String? _photoPath;
  String? _signaturePath;

  @override
  void dispose() {
    _sigCtrl.dispose();
    super.dispose();
  }

  Future<String?> _saveToDocuments(Uint8List bytes, String ext) async {
    final dir = await getApplicationDocumentsDirectory();
    final file = File('${dir.path}/captures/${const Uuid().v4()}.$ext');
    await file.create(recursive: true);
    await file.writeAsBytes(bytes);
    return file.path;
  }

  Future<void> _pickPhoto(ImageSource source) async {
    final picked = await _picker.pickImage(
      source: source,
      maxWidth: 1920,
      imageQuality: 82,
    );
    if (picked == null) return;

    final bytes = await picked.readAsBytes();
    final path = await _saveToDocuments(bytes, 'jpg');
    if (!mounted) return;
    setState(() => _photoPath = path);
  }

  Future<void> _saveSignature() async {
    if (_sigCtrl.isEmpty) return;
    final png = await _sigCtrl.toPngBytes();
    if (png == null) return;
    final path = await _saveToDocuments(png, 'png');
    if (!mounted) return;
    setState(() => _signaturePath = path);
  }

  void _confirm() {
    final okPhoto = !widget.requirePhoto || _photoPath != null;
    final okSig = !widget.requireSignature || _signaturePath != null;
    if (!okPhoto || !okSig) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(
            !okPhoto
                ? 'Adicione uma foto do equipamento.'
                : 'Capture a assinatura do colaborador.',
          ),
        ),
      );
      return;
    }
    Navigator.pop(
      context,
      CaptureResult(photoPath: _photoPath, signaturePath: _signaturePath),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Foto e Assinatura'),
        actions: [
          Padding(
            padding: const EdgeInsets.only(right: 8),
            child: TextButton(
              onPressed: _confirm,
              child: const Text('Concluir',
                  style: TextStyle(color: kGreen, fontWeight: FontWeight.w700)),
            ),
          ),
        ],
      ),
      body: ListView(
        padding: const EdgeInsets.fromLTRB(20, 8, 20, 24),
        children: [
          const Text('Foto do EPI',
              style: TextStyle(color: kMuted, fontSize: 12, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          AppCard(
            padding: const EdgeInsets.all(12),
            child: Column(
              children: [
                if (_photoPath != null)
                  ClipRRect(
                    borderRadius: BorderRadius.circular(12),
                    child: Image.file(File(_photoPath!), height: 190, fit: BoxFit.cover),
                  )
                else
                  Container(
                    height: 160,
                    alignment: Alignment.center,
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.03),
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: widget.requirePhoto
                            ? kRed.withValues(alpha: 0.3)
                            : Colors.white.withValues(alpha: 0.08),
                      ),
                    ),
                    child: const Icon(Icons.photo_camera_outlined, color: kMuted, size: 42),
                  ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    _PhotoButton(
                      icon: Icons.photo_camera,
                      label: 'Câmera',
                      onTap: () => _pickPhoto(ImageSource.camera),
                    ),
                    const SizedBox(width: 10),
                    _PhotoButton(
                      icon: Icons.photo_library_outlined,
                      label: 'Galeria',
                      onTap: () => _pickPhoto(ImageSource.gallery),
                    ),
                    if (_photoPath != null) ...[
                      const SizedBox(width: 10),
                      _PhotoButton(
                        icon: Icons.delete_outline,
                        label: 'Remover',
                        color: kRed,
                        onTap: () => setState(() => _photoPath = null),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
          const SizedBox(height: 22),
          const Text('Assinatura do colaborador',
              style: TextStyle(color: kMuted, fontSize: 12, fontWeight: FontWeight.w700)),
          const SizedBox(height: 8),
          AppCard(
            padding: const EdgeInsets.all(12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                ClipRRect(
                  borderRadius: BorderRadius.circular(12),
                  child: Signature(
                    controller: _sigCtrl,
                    backgroundColor: Colors.white,
                    height: 200,
                  ),
                ),
                const SizedBox(height: 10),
                Row(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    TextButton.icon(
                      onPressed: () => setState(() {
                        _sigCtrl.clear();
                        _signaturePath = null;
                      }),
                      icon: const Icon(Icons.refresh, color: kRed, size: 18),
                      label: const Text('Refazer',
                          style: TextStyle(color: kRed, fontWeight: FontWeight.w600)),
                    ),
                    const SizedBox(width: 12),
                    TextButton.icon(
                      onPressed: _sigCtrl.isEmpty ? null : _saveSignature,
                      icon: const Icon(Icons.check_circle_outline, color: kGreen, size: 18),
                      label: const Text('Salvar assinatura',
                          style: TextStyle(color: kGreen, fontWeight: FontWeight.w600)),
                    ),
                  ],
                ),
                if (_signaturePath != null)
                  const Text('Assinatura salva.',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: kGreen, fontSize: 12, fontWeight: FontWeight.w600)),
              ],
            ),
          ),
          const SizedBox(height: 16),
          const Text(
            'A assinatura comprova o recebimento do equipamento. Use o dedo ou a caneta sobre a área branca.',
            textAlign: TextAlign.center,
            style: TextStyle(color: kMuted, fontSize: 11.5),
          ),
        ],
      ),
    );
  }
}

class _PhotoButton extends StatelessWidget {
  const _PhotoButton({
    required this.icon,
    required this.label,
    required this.onTap,
    this.color = kIndigo,
  });

  final IconData icon;
  final String label;
  final VoidCallback onTap;
  final Color color;

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(10),
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(10),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, color: color, size: 18),
            const SizedBox(width: 6),
            Text(label,
                style: TextStyle(color: color, fontSize: 12.5, fontWeight: FontWeight.w700)),
          ],
        ),
      ),
    );
  }
}
