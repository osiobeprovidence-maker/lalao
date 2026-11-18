import 'dart:convert';
import 'dart:io';
import 'package:flutter/foundation.dart';

/// Connects the Flutter mobile app to the Lalao Convex & Supabase backend
/// while allowing offline/instant fallback to local repository state.
class BackendService {
  static final BackendService _instance = BackendService._internal();
  factory BackendService() => _instance;
  BackendService._internal();

  String convexUrl = const String.fromEnvironment(
    'CONVEX_URL',
    defaultValue: 'https://lalao-production.convex.cloud',
  );
  String supabaseUrl = const String.fromEnvironment(
    'SUPABASE_URL',
    defaultValue: '',
  );
  String? authToken;

  bool get isConfigured =>
      convexUrl.isNotEmpty && !convexUrl.contains('your-deployment-name');

  Future<Map<String, dynamic>?> query(
    String functionPath, [
    Map<String, dynamic> args = const {},
  ]) async {
    return _callConvex('query', functionPath, args);
  }

  Future<Map<String, dynamic>?> mutation(
    String functionPath, [
    Map<String, dynamic> args = const {},
  ]) async {
    return _callConvex('mutation', functionPath, args);
  }

  Future<Map<String, dynamic>?> action(
    String functionPath, [
    Map<String, dynamic> args = const {},
  ]) async {
    return _callConvex('action', functionPath, args);
  }

  Future<Map<String, dynamic>?> _callConvex(
    String type,
    String path,
    Map<String, dynamic> args,
  ) async {
    if (!isConfigured) return null;
    final client = HttpClient();
    client.connectionTimeout = const Duration(seconds: 6);
    try {
      final uri = Uri.parse('$convexUrl/api/$type');
      final request = await client.postUrl(uri);
      request.headers.set(HttpHeaders.contentTypeHeader, 'application/json');
      if (authToken != null && authToken!.isNotEmpty) {
        request.headers.set(
          HttpHeaders.authorizationHeader,
          'Bearer $authToken',
        );
      }
      request.write(jsonEncode({
        'path': path,
        'args': args,
        'format': 'json',
      }));
      final response = await request.close();
      if (response.statusCode >= 200 && response.statusCode < 300) {
        final body = await response.transform(utf8.decoder).join();
        final decoded = jsonDecode(body);
        if (decoded is Map<String, dynamic>) {
          return decoded;
        }
      }
    } catch (e) {
      debugPrint('[BackendService] $type($path) offline fallback: $e');
    } finally {
      client.close();
    }
    return null;
  }
}
